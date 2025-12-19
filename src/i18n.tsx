
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'es' | 'it' | 'fr' | 'pt' | 'de' | 'zh' | 'ja' | 'ko' | 'id' | 'vi' | 'ur' | 'hi' | 'ru' | 'ar' | 'bn' | 'pa' | 'sd';

export type Direction = 'ltr' | 'rtl';

const translations: Record<string, Record<string, string>> = {
    en: {
        'app.title': 'Conlang Studio',
        'app.subtitle': 'Professional Edition',
        'common.confirm': 'Are you sure?',
        'common.done': 'Done',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'nav.dashboard': 'Dashboard',
        'nav.phonology': 'Phonology Engine',
        'nav.lexicon': 'Lexicon',
        'nav.grammar': 'Syntax & Grammar',
        'nav.genevolve': 'GenEvolve',
        'nav.console': 'Studio Console',
        'nav.source': 'Source Code',
        'nav.script': 'Script Editor',
        'nav.notebook': 'Notebook',
        'settings.title': 'Settings',
        'menu.toggle_sidebar': 'Toggle Sidebar',
        'defaults.project_name': 'New Conlang',
        'defaults.author': 'Linguist',
        'defaults.grammar': '// Define your grammar here',
        'defaults.phonology_name': 'Standard Phonology',
        'defaults.gen_constraints': '',
        'defaults.gen_vibe': 'ancient',
        'pos.Noun': 'Noun',
        'pos.Verb': 'Verb',
        'pos.Adjective': 'Adjective',
        'pos.Adverb': 'Adverb',
        'pos.Pronoun': 'Pronoun',
        'pos.Preposition': 'Preposition',
        'pos.Conjunction': 'Conjunction',
        'pos.Interjection': 'Interjection',
        'pos.placeholder': 'Select POS...',
        'lexicon.search': 'Search lexicon...',
        'lexicon.new': 'New Entry',
        'lexicon.edit': 'Edit Entry',
        'lexicon.save': 'Save Entry',
        'lexicon.cancel': 'Cancel',
        'lexicon.word': 'Word',
        'lexicon.ipa': 'IPA',
        'lexicon.pos': 'Part of Speech',
        'lexicon.definition': 'Definition',
        'lexicon.etymology': 'Etymology',
        'lexicon.derivedFrom': 'Derived From',
        'lexicon.root': '-- Root --',
        'lexicon.conflicts_group': 'Conflicts',
        'lexicon.view_mode_pinned': 'Pin Conflicts',
        'lexicon.view_mode_hide': 'Hide Conflicts',
        'lexicon.view_mode_only': 'Show Only Conflicts',
        'lexicon.results_count': 'results',
        'lexicon.entries_count': 'entries',
        'lexicon.ai_gen_btn': 'AI Generate',
        'lexicon.no_matches': 'No matches found.',
        'lexicon.try_adjust': 'Try adjusting filters.',
        'lexicon.descendants': 'Descendants',
        'lexicon.delete_confirm_title': 'Delete Entry?',
        'lexicon.delete_confirm_desc': 'Delete word?',
        'lexicon.action_cannot_undo': 'Action cannot be undone.',
        'lexicon.filter_options': 'Filter Options',
        'lexicon.search_in': 'Search In',
        'lexicon.non_canon': 'Non-Canon',
        'val.errors_title': 'Validation Errors',
        'integrity.title': 'Integrity Warning',
        'integrity.warning': 'Dependents found.',
        'integrity.desc': 'This action may break references.',
        'integrity.action_cancel': 'Cancel',
        'integrity.action_unlink': 'Unlink and Delete',
        'genword.title': 'Word Generator',
        'genword.desc': 'AI word generation',
        'genword.config': 'Configuration',
        'genword.constraints': 'Constraints',
        'genword.constraints_ph': 'Structure...',
        'genword.vibe': 'Vibe',
        'genword.vibe_ph': 'Style...',
        'genword.count': 'Count',
        'genword.dreaming': 'Dreaming...',
        'genword.generate': 'Generate',
        'genword.results': 'Results',
        'genword.keep': 'Keep',
        'genword.clear': 'Clear',
        'genword.placeholder': 'No words generated yet.',
        'genevolve.commit_alert': 'Changes committed.',
        'genevolve.title': 'Evolution',
        'genevolve.desc': 'Apply sound changes',
        'genevolve.run': 'Run',
        'genevolve.sound_changes': 'Rules',
        'genevolve.add_rule': 'Add Rule',
        'genevolve.preview': 'Preview',
        'genevolve.commit': 'Commit',
        'genevolve.placeholder': 'No preview.',
        'grammar.title': 'Grammar',
        'grammar.desc': 'Syntax and Morphology',
        'grammar.tab.syntax': 'Syntax',
        'grammar.tab.morphology': 'Morphology',
        'grammar.saved': 'Saved',
        'grammar.bnf_placeholder': 'Grammar rules...',
        'grammar.applies_to': 'Applies to',
        'grammar.type_sentence': 'Test sentence...',
        'grammar.analysis_output': 'Output',
        'grammar.morph_rules': 'Morphology Rules',
        'grammar.add_rule': 'Add Rule',
        'grammar.no_morph_rules': 'No rules.',
        'dashboard.by': 'by',
        'dashboard.lexiconsize': 'Words',
        'dashboard.manage_lexicon': 'Lexicon',
        'dashboard.manage_lexicon_desc': 'View and edit words',
        'dashboard.define_grammar': 'Grammar',
        'dashboard.define_grammar_desc': 'Rules and structure',
        'dashboard.recent_words': 'Recent Activity',
        'dashboard.pos_dist': 'POS Distribution',
        'dashboard.no_data': 'No data available.',
        'wizard.overwrite_confirm': 'Overwrite current project?',
        'menu.file': 'File',
        'menu.new_project': 'New',
        'menu.open_project': 'Open',
        'menu.export_json': 'Export',
        'menu.view': 'View',
        'menu.zoom_in': 'Zoom In',
        'menu.zoom_out': 'Zoom Out',
        'menu.tools': 'Tools',
        'menu.validation': 'Validation',
        'menu.settings': 'Settings',
        'menu.preferences': 'Preferences',
        'menu.help': 'Help',
        'menu.docs': 'Docs',
        'menu.about': 'About',
        'menu.env': 'Environment',
        'settings.dark': 'Dark',
        'settings.light': 'Light',
        'settings.tokyo': 'Tokyo Night',
        'settings.tokyo_light': 'Tokyo Light',
        'settings.done': 'Done',
        'wizard.create_title': 'New Project',
        'wizard.create_desc': 'Start fresh',
        'wizard.edit_title': 'Edit Project',
        'wizard.edit_desc': 'Modify metadata',
        'wizard.name': 'Name',
        'wizard.author': 'Author',
        'wizard.constraints': 'Constraints',
        'wizard.optional': 'Optional',
        'wizard.desc': 'Description',
        'wizard.create_btn': 'Create',
        'wizard.save_btn': 'Save',
        'morph.paradigms': 'Paradigms',
        'val.banned_seq': 'Banned Sequence',
        'val.invalid_char': 'Invalid Character',
        'val.must_start': 'Must Start With',
        'val.must_end': 'Must End With',
        'val.structure_fail': 'Structure Failure',
        'val.duplicate': 'Duplicate',
        'val.banned_placeholder': 'Sequence...',
        'val.no_bans': 'No banned sequences.',
        'val.no_restrictions': 'No restrictions.',
        'val.target_placeholder': 'Target...',
        'lbl.allow_duplicates': 'Allow Duplicates',
        'lbl.allow_duplicates_desc': 'Permit multiple entries with same word.',
        'lbl.case_sensitive': 'Case Sensitive',
        'lbl.case_sensitive_desc': 'A != a',
        'lbl.allowed_chars': 'Whitelist',
        'lbl.allowed_chars_desc': 'Regex for allowed characters.',
        'lbl.structure': 'Syllable Regex',
        'lbl.structure_desc': 'Phonotactic pattern.',
        'lbl.starts_with': 'Starts With',
        'lbl.ends_with': 'Ends With',
        'sort.custom_order': 'Alphabet Order',
        'sort.custom_order_desc': 'Define custom sorting.',
        'sort.locale': 'Locale',
        'sort.presets': 'Presets',
        'sort.preset_latin': 'Latin',
        'sort.preset_latin_ext': 'Latin Ext',
        'sort.preset_cyrillic': 'Cyrillic',
        'sort.preset_greek': 'Greek',
        'sort.preset_hiragana': 'Hiragana',
        'sort.preset_katakana': 'Katakana',
        'sort.preset_arabic': 'Arabic',
        'source.title': 'Source',
        'source.desc': 'JSON Inspector',
        'source.reset': 'Reset',
        'source.apply': 'Apply',
        'source.warning': 'Direct editing can break the project.',
        'phonology.ai_generator': 'AI Generator',
        'phonology.vibe_label': 'Description',
        'phonology.vibe_placeholder': 'Describe the sounds...',
        'phonology.analyze_btn': 'Analyze',
        'phonology.generate_btn': 'Generate',
        'phonology.ai_disabled_title': 'AI Disabled',
        'phonology.ai_disabled_desc': 'Enable AI in settings.',
        'phonology.stats': 'Statistics',
        'phonology.inventory': 'Inventory',
        'phonology.consonants': 'Consonants',
        'phonology.vowels': 'Vowels',
        'phonology.syllable_struct': 'Structure',
        'phonology.undefined': 'Undefined',
        'msg.about_title': 'Conlang Studio',
        'msg.about_desc': 'The world\'s most advanced conlang IDE.'
    },
    es: {
        'app.title': 'Conlang Studio',
        'app.subtitle': 'Edición Profesional',
        'nav.dashboard': 'Panel de Control',
        'nav.lexicon': 'Léxico',
        'nav.grammar': 'Gramática',
        'nav.script': 'Editor de Escritura',
        'settings.title': 'Ajustes',
        'pos.Noun': 'Sustantivo',
        'pos.Verb': 'Verbo',
        'pos.Adjective': 'Adjetivo',
        'pos.Adverb': 'Adverbio',
        'common.confirm': '¿Estás seguro?',
        'common.delete': 'Eliminar'
    },
    it: {
        'app.title': 'Conlang Studio',
        'app.subtitle': 'Edizione Professionale',
        'nav.dashboard': 'Dashboard',
        'nav.lexicon': 'Lessico',
        'nav.grammar': 'Grammatica',
        'settings.title': 'Impostazioni'
    },
    fr: {
        'app.title': 'Conlang Studio',
        'app.subtitle': 'Édition Professionnelle',
        'nav.dashboard': 'Tableau de Bord',
        'nav.lexicon': 'Lexique',
        'nav.grammar': 'Grammaire',
        'settings.title': 'Paramètres'
    },
    pt: {
        'app.title': 'Conlang Studio',
        'app.subtitle': 'Edição Profissional',
        'nav.dashboard': 'Painel',
        'nav.lexicon': 'Léxico',
        'nav.grammar': 'Gramática',
        'settings.title': 'Configurações'
    },
    de: {
        'app.title': 'Conlang Studio',
        'app.subtitle': 'Profi-Edition',
        'nav.dashboard': 'Dashboard',
        'nav.lexicon': 'Lexikon',
        'nav.grammar': 'Grammatik',
        'settings.title': 'Einstellungen'
    },
    zh: {
        'app.title': '语言创作室',
        'app.subtitle': '专业版',
        'nav.dashboard': '仪表板',
        'nav.lexicon': '词汇表',
        'nav.grammar': '语法与句法',
        'settings.title': '设置'
    },
    ja: {
        'app.title': 'コンラン・スタジオ',
        'app.subtitle': 'プロフェッショナル版',
        'nav.dashboard': 'ダッシュボード',
        'nav.lexicon': '語彙',
        'nav.grammar': '文法と構文',
        'settings.title': '設定'
    },
    ko: {
        'app.title': '콘랑 스튜디오',
        'app.subtitle': '프로페셔널 에디션',
        'nav.dashboard': '대시보드',
        'nav.lexicon': '어휘',
        'nav.grammar': '문법 및 구문',
        'settings.title': '설정'
    },
    ru: {
        'app.title': 'Конланг Студио',
        'app.subtitle': 'Профессиональное издание',
        'nav.dashboard': 'Панель управления',
        'nav.lexicon': 'Лексикон',
        'nav.grammar': 'Грамматика',
        'settings.title': 'Настройки'
    },
    ar: {
        'app.title': 'استوديو كونلانج',
        'app.subtitle': 'نسخة احترافية',
        'nav.dashboard': 'لوحة القيادة',
        'nav.lexicon': 'المعجم',
        'nav.grammar': 'القواعد والنحو',
        'settings.title': 'الإعدادات'
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    direction: Direction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    const t = (key: string): string => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    };

    const direction: Direction = ['ar', 'ur', 'sd', 'pa'].includes(language) ? 'rtl' : 'ltr';

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, direction }}>
            <div dir={direction} className="h-full w-full">
                {children}
            </div>
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
