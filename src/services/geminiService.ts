import { GoogleGenerativeAI } from "@google/generative-ai";
import { LexiconEntry, ProjectConstraints, MorphologyState, PhonologyConfig, SoundChangeRule } from "../types";

const STORAGE_KEY = 'user_gemini_api_key';

export const getApiKey = () => {
    const key = localStorage.getItem(STORAGE_KEY) || (import.meta.env.VITE_GEMINI_API_KEY as string) || "";
    // Aggressively trim whitespace and any accidental quotes
    return key.trim().replace(/^["']|["']$/g, '');
};

export const setApiKey = (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
};

export const isApiKeySet = () => !!getApiKey();

const getGenAI = () => {
    let key = getApiKey();
    if (!key) throw new Error("API Key not configured. Please set it in Settings.");

    // Debug log to check if key is a placeholder
    if (key === "PLACEHOLDER_API_KEY") {
        console.warn("WARNING: Using PLACEHOLDER_API_KEY. This will likely fail.");
    } else {
        console.log(`Using API Key starting with: ${key.substring(0, 4)}... (Length: ${key.length})`);
    }

    // Ensure the key is trimmed before being used by the SDK
    return new GoogleGenerativeAI(key.trim());
};

/**
 * Sanitizes and parses JSON from Gemini, handling potential Markdown fences.
 */
const safeParseJSON = (text: string): any => {
    try {
        let jsonString = text;
        // 1. Attempt to extract JSON from a markdown code block
        const markdownMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (markdownMatch && markdownMatch[1]) {
            jsonString = markdownMatch[1];
        } else {
            // 2. If not in markdown, try to find the first { and last }
            const firstCurly = text.indexOf('{');
            const lastCurly = text.lastIndexOf('}');
            if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
                jsonString = text.substring(firstCurly, lastCurly + 1);
            } else {
                // 3. More aggressive regex to find a JSON-like structure
                const aggressiveMatch = text.match(/{\s*[\"'\w\d]*?:[\s\S]*?}/);
                if (aggressiveMatch && aggressiveMatch[0]) {
                    jsonString = aggressiveMatch[0];
                } else {
                    // 4. If nothing else, trim and try parsing (might be plain JSON without outer conversation)
                    jsonString = text.trim();
                }
            }
        }

        // Aggressively clean up any leading/trailing non-JSON characters that might have slipped through
        jsonString = jsonString.trim();
        // Ensure it starts with { or [ to be valid JSON (after trimming)
        if (!jsonString.startsWith('{') && !jsonString.startsWith('[')) {
            // If it doesn't start with { or [, it's likely still malformed or conversational. Try to find the first [ or {
            const firstBracket = jsonString.indexOf('[');
            const firstBrace = jsonString.indexOf('{');

            if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
                jsonString = jsonString.substring(firstBracket);
            } else if (firstBrace !== -1) {
                jsonString = jsonString.substring(firstBrace);
            } else {
                throw new Error("No valid JSON start found after aggressive cleaning.");
            }
        }

        return JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON Parse Error. Raw content:", text);
        throw e;
    }
};

/**
 * Parses raw text into a PhonologyConfig object, providing default values for missing fields.
 */
const safeParsePhonologyConfig = (text: string): PhonologyConfig => {
    try {
        const parsed = safeParseJSON(text);

        // Ensure all PhonologyConfig fields are present with default values if missing or malformed
        const phonologyConfig: PhonologyConfig = {
            name: typeof parsed.name === 'string' ? parsed.name : '',
            description: typeof parsed.description === 'string' ? parsed.description : '',
            consonants: Array.isArray(parsed.consonants) ? parsed.consonants : [],
            vowels: Array.isArray(parsed.vowels) ? parsed.vowels : [],
            syllableStructure: typeof parsed.syllableStructure === 'string' ? parsed.syllableStructure : '',
            bannedCombinations: Array.isArray(parsed.bannedCombinations) ? parsed.bannedCombinations : [],
        };

        return phonologyConfig;

    } catch (e) {
        console.error("Phonology Config Parse Error. Raw content:", text);
        throw e;
    }
};

/**
 * REPAIR LEXICON: Batch-processed repairs to avoid output token limits.
 */
export const repairLexicon = async (
    invalidEntries: LexiconEntry[],
    constraints: ProjectConstraints
): Promise<{ success: boolean; repairs: Array<{ id: string, word: string, ipa: string }>; message?: string }> => {

    if (invalidEntries.length === 0) return { success: true, repairs: [] };

    const CHUNK_SIZE = 15; // Process in small batches to ensure valid JSON output
    const allRepairs: Array<{ id: string, word: string, ipa: string }> = [];

    const rules = `
    CONSTRAINTS:
    - Banned: ${constraints.bannedSequences.join(', ') || 'None'}
    - Graphemes (Regex): ${constraints.allowedGraphemes || 'Any'}
    - Structure: ${constraints.phonotacticStructure || 'Free'}
    `;
    try {
        // Initialize client with the API key from environment variables
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({
            model: "gemma-3-27b-it",

        });

        for (let i = 0; i < invalidEntries.length; i += CHUNK_SIZE) {
            const chunk = invalidEntries.slice(i, i + CHUNK_SIZE);

            console.log("Iniciando generación con el modelo gemma-3-27b-it...");
            const result = await model.generateContent("You are a linguistic repair engineer. \n\nTask: Fix the following constructed words so they comply with the rules below. \nRules:\n" +
                rules +
                "\nKeep the phonological soul of the word while fixing violations.\n\nInput List (JSON):\n" +
                JSON.stringify(chunk.map(e => ({ id: e.id, word: e.word, ipa: e.ipa }))) +
                "\n\nOutput: Return a valid JSON array of objects with \"id\", \"word\", and \"ipa\".");

            const response = await result.response;
            const repairedChunk = safeParseJSON(response.text());
            allRepairs.push(...repairedChunk);
        }

        return { success: true, repairs: allRepairs };
    } catch (e: any) {
        console.error("Batch Repair Error:", e);
        const errorMsg = e?.message || e?.toString() || "Unknown error";
        return {
            success: false,
            repairs: [],
            message: "AI Repair Failed: " + errorMsg + ". Verifica tu API key en Settings."
        };
    }
};

export const suggestIPA = async (word: string, phonologyDescription: string): Promise<string> => {
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });
        console.log("Iniciando generación con el modelo gemma-3-27b-it...");
        const result = await model.generateContent("Given the following phonological rules/description: \"" + phonologyDescription + "\", provide the most likely IPA transcription for the word \"" + word + "\". Return ONLY the IPA string, enclosed in forward slashes.");
        const response = await result.response;
        return response.text().trim();
    } catch (error: any) {
        console.error("IPA Suggestion Error:", error?.message || error);
        return "/error/";
    }
};

export const generateWords = async (
    count: number,
    constraints: string,
    vibe: string,
    projectRules?: ProjectConstraints
): Promise<Array<{ word: string; ipa: string }>> => {
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({
            model: "gemma-3-27b-it",

        });
        const safeCount = Math.min(count, 15);
        let globalRulesPrompt = "";
        if (projectRules) {
            const banned = projectRules.bannedSequences.length > 0 ? "Banned sequences: " + projectRules.bannedSequences.join(', ') + "." : "";
            const allowed = projectRules.allowedGraphemes ? "Allowed characters (Regex): [" + projectRules.allowedGraphemes + "]." : "";
            const structure = projectRules.phonotacticStructure ? "Must match Regex Structure: " + projectRules.phonotacticStructure : "";
            globalRulesPrompt = "STRICT RULES: " + banned + " " + allowed + " " + structure;
        }

        console.log("Iniciando generación con el modelo gemma-3-27b-it...");
        const result = await model.generateContent("Generate " + safeCount + " unique constructed words. Vibe: " + vibe + ". " + globalRulesPrompt + ". Return JSON array with \"word\" and \"ipa\".");
        const response = await result.response;
        const generatedWords = safeParseJSON(response.text());

        if (!Array.isArray(generatedWords) || generatedWords.length === 0) {
            throw new Error("No words could be generated. This might be due to overly restrictive constraints or an issue with the AI model. Please adjust your constraints and try again.");
        }

        return generatedWords;
    } catch (error: any) {
        console.error("Generation Error:", error?.message || error);
        throw new Error(`Error generating words: ${error?.message || 'Verifica tu API key en Settings'}`);
    }
};

export const evolveWords = async (
    words: LexiconEntry[],
    rules: SoundChangeRule[]
): Promise<LexiconEntry[]> => {
    if (words.length === 0 || rules.length === 0) return words;

    const CHUNK_SIZE = 10;
    const evolvedLexicon: LexiconEntry[] = [...words];

    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({
            model: "gemma-3-27b-it",

        });

        for (let i = 0; i < words.length; i += CHUNK_SIZE) {
            const chunk = words.slice(i, i + CHUNK_SIZE);
            console.log("Iniciando generación con el modelo gemma-3-27b-it...");
            const result = await model.generateContent("Apply sound changes: " + rules.map(r => r.rule).join('\n') + ". Words: " + chunk.map(w => w.word).join(', ') + ". Return JSON array of objects with \"originalWord\", \"newWord\", \"newIPA\", \"changeLog\".");
            const response = await result.response;
            const results = safeParseJSON(response.text());
            results.forEach((res: any) => {
                const index = evolvedLexicon.findIndex(w => w.word === res.originalWord);
                if (index !== -1) {
                    evolvedLexicon[index] = {
                        ...evolvedLexicon[index],
                        word: res.newWord,
                        ipa: res.newIPA,
                        etymology: (evolvedLexicon[index].etymology || '') + '; ' + res.changeLog
                    };
                }
            });
        }
        return evolvedLexicon;
    } catch (error: any) {
        console.error("Evolution Error:", error?.message || error);
        return words;
    }
};

export const processCommandAI = async (
    lexicon: LexiconEntry[],
    instruction: string,
    constraints: ProjectConstraints
): Promise<{ success: boolean; modifiedCount: number; newLexicon?: LexiconEntry[]; message?: string }> => {
    if (lexicon.length === 0) return { success: false, modifiedCount: 0 };
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({
            model: "gemma-3-27b-it",

        });

        console.log("Iniciando generación con el modelo gemma-3-27b-it...");
        const result = await model.generateContent("Apply bulk changes to lexicon. Instruction: \"" + instruction + "\". Constraints: " + constraints.allowedGraphemes + ". Return JSON object with \"modifications\" array containing objects with \"id\" and changed fields.");
        const response = await result.response;
        const resultData = safeParseJSON(response.text());
        const mods = resultData.modifications || [];
        const newLexicon = lexicon.map(entry => {
            const mod = mods.find((m: any) => m.id === entry.id);
            return mod ? { ...entry, ...mod } : entry;
        });
        return { success: true, modifiedCount: mods.length, newLexicon };
    } catch (e: any) {
        console.error("CommandAI Error:", e?.message || e);
        return { success: false, modifiedCount: 0, message: e?.message };
    }
};

export const analyzeSyntax = async (sentence: string, grammarRules: string, morphology?: MorphologyState): Promise<string> => {
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });
        console.log("Iniciando generación con el modelo gemma-3-27b-it...");
        const result = await model.generateContent("Analyze sentence \"" + sentence + "\" using Grammar: " + grammarRules + ". Morphology: " + JSON.stringify(morphology) + ". Provide gloss and AST.");
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Syntax Analysis Error:", error?.message || error);
        return "Error analyzing syntax. Verifica tu API key.";
    }
};

export const generatePhonology = async (description: string): Promise<PhonologyConfig> => {
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({
            model: "gemma-3-27b-it",

        });

        console.log("Iniciando generación con el modelo gemma-3-27b-it...");
        const result = await model.generateContent("Create phonology from description: \"" + description + "\". Your response MUST be a JSON object that strictly adheres to the PhonologyConfig TypeScript interface, including all fields. If a field has no data, use an empty array for lists (e.g., `consonants`, `vowels`, `bannedCombinations`) or an empty string for strings (e.g., `name`, `description`, `syllableStructure`). DO NOT include any conversational text, markdown fences (e.g., ```json), or extra characters, just the raw JSON object. Example of a complete PhonologyConfig JSON object: {\"name\":\"\", \"description\":\"\", \"consonants\":[], \"vowels\":[], \"syllableStructure\":\"\", \"bannedCombinations\":[]}");
        const response = await result.response;
        const textResponse = response.text();
        console.log("Raw AI response for phonology:", textResponse);
        const parsedPhonology = safeParsePhonologyConfig(textResponse);
        console.log("Parsed phonology from AI:", parsedPhonology);
        return parsedPhonology;
    } catch (error: any) {
        console.error("Phonology Generation Error:", error?.message || error);
        // Return a default PhonologyConfig on error to prevent crashes and provide a usable empty state
        return {
            name: "Default Phonology",
            description: "Failed to generate phonology. Please check your API key and prompt.",
            consonants: [],
            vowels: [],
            syllableStructure: "CV",
            bannedCombinations: [],
        };
    }
};
