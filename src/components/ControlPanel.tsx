import React from 'react';
import { Radio, ChevronDown, Sparkles, Loader2, Globe, Clock, SlidersHorizontal } from 'lucide-react';
import { DurationOption, LanguageOption, ToneOption } from '@/types/radio';

interface ControlsProps {
  topic: string;
  setTopic: (t: string) => void;
  duration: DurationOption;
  setDuration: (d: DurationOption) => void;
  language: LanguageOption;
  setLanguage: (l: LanguageOption) => void;
  tone: ToneOption;
  setTone: (t: ToneOption) => void;
  onGenerate: () => void;
  isLoading: boolean;
  dailyAllowance: number;
}

export function ControlPanel({
  topic,
  setTopic,
  duration,
  setDuration,
  language,
  setLanguage,
  tone,
  setTone,
  onGenerate,
  isLoading,
  dailyAllowance,
}: ControlsProps) {
  const durations: DurationOption[] = [3, 5, 8, 10, 15];
  const languages: LanguageOption[] = ['Hindi', 'English', 'Hinglish', 'Marathi', 'Tamil', 'Bengali', 'Gujarati'];
  const tones: ToneOption[] = ['INFORMATIVE', 'ENTERTAINING', 'CASUAL', 'DRAMATIC', 'EDUCATIONAL'];

  const suggestions = [
    'Impact of Quantum Computing on Cybersecurity',
    'IPL Season Strategy and Player Auctions',
    'Traditional Indian Spices & Health Benefits',
    'Space Exploration: ISRO Gaganyaan Mission',
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Generate a radio show</h1>
            <p className="text-xs text-slate-400">Powered by Free Edge TTS & Local AI Radio</p>
          </div>
        </div>

        {/* Daily Allowance Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Daily allowance <strong className="text-indigo-400">{dailyAllowance}/50</strong></span>
        </div>
      </div>

      {/* Main Prompt Input Box */}
      <div className="relative group rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-2xl backdrop-blur-xl focus-within:border-indigo-500/50 transition-all duration-300">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Radio Topic & Concept
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="I want a talk radio show about...."
          rows={3}
          className="w-full bg-transparent text-slate-100 text-lg placeholder-slate-500 border-none outline-none resize-none focus:ring-0 leading-relaxed"
        />

        {/* Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
          <span className="text-xs text-slate-500 font-medium">Try topic:</span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setTopic(s)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 border border-slate-700/50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Bottom Control Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Duration Selector */}
            <div className="relative group/select">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs font-medium text-slate-200 cursor-pointer transition">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{duration} MIN</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) as DurationOption)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              >
                {durations.map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-slate-200">
                    {d} MIN (~{d * 150} words)
                  </option>
                ))}
              </select>
            </div>

            {/* Language Selector */}
            <div className="relative group/select">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs font-medium text-slate-200 cursor-pointer transition">
                <Globe className="w-3.5 h-3.5 text-pink-400" />
                <span>Language: <strong className="text-slate-100">{language}</strong></span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageOption)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang} className="bg-slate-900 text-slate-200">
                    {lang} {lang === 'Hindi' ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Tone Selector */}
            <div className="relative group/select">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs font-medium text-slate-200 cursor-pointer transition">
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                <span>Tone: <strong className="text-slate-100">{tone}</strong></span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as ToneOption)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              >
                {tones.map((t) => (
                  <option key={t} value={t} className="bg-slate-900 text-slate-200">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* GENERATE Button */}
          <button
            onClick={onGenerate}
            disabled={isLoading || !topic.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-white" />
                <span>GENERATE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
