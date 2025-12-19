import { GoogleGenerativeAI } from "@google/generative-ai";
import { LexiconEntry, ProjectConstraints, MorphologyState, PhonologyConfig, SoundChangeRule } from "../types";

export const isApiKeySet = () => !!(process.env.GEMINI_API_KEY || "");

/**
 * Sanitizes and parses JSON from Gemini, handling potential Markdown fences.
 */
const safeParseJSON = (text: string) => {
    try {
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("JSON Parse Error. Raw content:", text);
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
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        for (let i = 0; i < invalidEntries.length; i += CHUNK_SIZE) {
            const chunk = invalidEntries.slice(i, i + CHUNK_SIZE);

            const result = await model.generateContent(`You are a linguistic repair engineer. 
                
                Task: Fix the following constructed words so they comply with the rules below. 
                Rules:
                ${rules}

                Keep the phonological soul of the word while fixing violations.

                Input List (JSON):
                ${JSON.stringify(chunk.map(e => ({ id: e.id, word: e.word, ipa: e.ipa })))}

                Output: Return a valid JSON array of objects with "id", "word", and "ipa".`);

            const response = await result.response;
            const repairedChunk = safeParseJSON(response.text());
            allRepairs.push(...repairedChunk);
        }

        return { success: true, repairs: allRepairs };
    } catch (e: any) {
        console.error("Batch Repair Error:", e);
        return { success: false, repairs: [], message: "AI Repair Failed: Output truncated or invalid JSON." };
    }
};

export const suggestIPA = async (word: string, phonologyDescription: string): Promise<string> => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Given the following phonological rules/description: "${phonologyDescription}", provide the most likely IPA transcription for the word "${word}". Return ONLY the IPA string, enclosed in forward slashes.`);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
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
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });
        const safeCount = Math.min(count, 50);
        let globalRulesPrompt = "";
        if (projectRules) {
            const banned = projectRules.bannedSequences.length > 0 ? `Banned sequences: ${projectRules.bannedSequences.join(', ')}.` : "";
            const allowed = projectRules.allowedGraphemes ? `Allowed characters (Regex): [${projectRules.allowedGraphemes}].` : "";
            const structure = projectRules.phonotacticStructure ? `Must match Regex Structure: ${projectRules.phonotacticStructure}` : "";
            globalRulesPrompt = `STRICT RULES: ${banned} ${allowed} ${structure}`;
        }

        const result = await model.generateContent(`Generate ${safeCount} unique constructed words. Vibe: ${vibe}. ${globalRulesPrompt}. Return JSON array with "word" and "ipa".`);
        const response = await result.response;
        return safeParseJSON(response.text());
    } catch (error) {
        console.error("Generation Error:", error);
        return [];
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
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        for (let i = 0; i < words.length; i += CHUNK_SIZE) {
            const chunk = words.slice(i, i + CHUNK_SIZE);
            const result = await model.generateContent(`Apply sound changes: ${rules.map(r => r.rule).join('\n')}. Words: ${chunk.map(w => w.word).join(', ')}. Return JSON array of objects with "originalWord", "newWord", "newIPA", "changeLog".`);
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
    } catch (error) {
        console.error("Evolution Error:", error);
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
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const result = await model.generateContent(`Apply bulk changes to lexicon. Instruction: "${instruction}". Constraints: ${constraints.allowedGraphemes}. Return JSON object with "modifications" array containing objects with "id" and changed fields.`);
        const response = await result.response;
        const resultData = safeParseJSON(response.text());
        const mods = resultData.modifications || [];
        const newLexicon = lexicon.map(entry => {
            const mod = mods.find((m: any) => m.id === entry.id);
            return mod ? { ...entry, ...mod } : entry;
        });
        return { success: true, modifiedCount: mods.length, newLexicon };
    } catch (e: any) {
        console.error("CommandAI Error:", e);
        return { success: false, modifiedCount: 0 };
    }
};

export const analyzeSyntax = async (sentence: string, grammarRules: string, morphology?: MorphologyState): Promise<string> => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent(`Analyze sentence "${sentence}" using Grammar: ${grammarRules}. Morphology: ${JSON.stringify(morphology)}. Provide gloss and AST.`);
        const response = await result.response;
        return response.text();
    } catch (error) {
        return "Error analyzing syntax.";
    }
};

export const generatePhonology = async (description: string): Promise<PhonologyConfig> => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const result = await model.generateContent(`Create phonology from description: "${description}". Return JSON complying with the app's PhonologyConfig schema.`);
        const response = await result.response;
        return safeParseJSON(response.text());
    } catch (error) {
        console.error("Phonology Generation Error:", error);
        throw new Error("Failed to generate phonology.");
    }
};
