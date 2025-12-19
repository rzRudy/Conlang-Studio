
import React, { useState } from 'react';
import { X, Moon, Sun, CloudMoon, Cpu, CloudSun, Palette, Download, Upload, Check } from 'lucide-react';
import { AppSettings, CustomTheme } from '../types';
import { useTranslation, Language } from '../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
}

const DEFAULT_CUSTOM: CustomTheme = {
  bgMain: '#0f172a',
  bgPanel: '#1e293b',
  text1: '#f8fafc',
  text2: '#94a3b8',
  accent: '#3b82f6'
};

import { isApiKeySet } from '../services/geminiService';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  const { language, setLanguage, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'THEME'>('GENERAL');
  const hasApiKey = isApiKeySet();

  if (!isOpen) return null;

  // Filtrado final: Solo Inglés disponible por requerimiento de Arquitectura Profesional
  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' }
  ];

  const handleCustomUpdate = (key: keyof CustomTheme, val: string) => {
    const current = settings.customTheme || DEFAULT_CUSTOM;
    onUpdateSettings({ ...settings, theme: 'custom', customTheme: { ...current, [key]: val } });
  };

  const exportTheme = () => {
    const theme = settings.customTheme || DEFAULT_CUSTOM;
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cs-theme-custom.json`;
    a.click();
  };

  const importTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          onUpdateSettings({ ...settings, theme: 'custom', customTheme: imported });
        } catch (err) { alert('Invalid theme file'); }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Preferences Studio</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex border-b border-slate-800 bg-slate-900 text-sm">
          <button onClick={() => setActiveTab('GENERAL')} className={`px-6 py-2 font-bold ${activeTab === 'GENERAL' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>General</button>
          <button onClick={() => setActiveTab('THEME')} className={`px-6 py-2 font-bold ${activeTab === 'THEME' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>Visual Identity</button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {activeTab === 'GENERAL' ? (
            <>
              <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-200 font-bold text-sm"><Cpu size={16} className="text-purple-400" /> Cognitive AI Service</div>
                  <p className="text-[10px] text-slate-400">Enable Neural-Engine for linguistics.</p>
                </div>
                <input type="checkbox" checked={settings.enableAI} onChange={(e) => onUpdateSettings({ ...settings, enableAI: e.target.checked })} className="w-5 h-5 rounded" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Language</label>
                <div className="grid grid-cols-1 gap-2 bg-slate-950 p-2 rounded">
                  {languages.map(lang => (
                    <button key={lang.code} onClick={() => setLanguage(lang.code)} className={`py-1.5 text-xs rounded ${language === lang.code ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-200'}`}>{lang.label}</button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Global Presets</label>
                <div className="grid grid-cols-3 gap-2">
                  {['dark', 'light', 'tokyo-night'].map(t => (
                    <button key={t} onClick={() => onUpdateSettings({ ...settings, theme: t as any })} className={`p-2 text-[10px] font-bold uppercase rounded border ${settings.theme === t ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>{t.replace('-', ' ')}</button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm"><Palette size={16} /> Custom Branding</div>
                  <div className="flex gap-2">
                    <button onClick={exportTheme} className="p-1 hover:bg-slate-800 rounded text-slate-400" title="Export JSON"><Download size={14} /></button>
                    <label className="p-1 hover:bg-slate-800 rounded text-slate-400 cursor-pointer" title="Import JSON"><Upload size={14} /><input type="file" onChange={importTheme} className="hidden" accept=".json" /></label>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { k: 'bgMain', l: 'Canvas Background' },
                    { k: 'bgPanel', l: 'Secondary Panels' },
                    { k: 'text1', l: 'Primary Text' },
                    { k: 'accent', l: 'Active Accent' }
                  ].map(item => (
                    <div key={item.k} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{item.l}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">{(settings.customTheme as any)?.[item.k] || (DEFAULT_CUSTOM as any)[item.k]}</span>
                        <input type="color" value={(settings.customTheme as any)?.[item.k] || (DEFAULT_CUSTOM as any)[item.k]} onChange={(e) => handleCustomUpdate(item.k as any, e.target.value)} className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer" />
                      </div>
                    </div>
                  ))}
                </div>
                {settings.theme === 'custom' && <div className="mt-4 text-center text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1"><Check size={10} /> Active Theme</div>}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold shadow-lg shadow-blue-900/20">Finalize Changes</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
