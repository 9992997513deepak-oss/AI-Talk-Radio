'use client';

import React, { useState, useEffect } from 'react';
import { ControlPanel } from '@/components/ControlPanel';
import { RadioPlayer } from '@/components/RadioPlayer';
import { DurationOption, LanguageOption, ToneOption, ShowResponse } from '@/types/radio';
import { Radio, History, Trash2, Clock, Globe, AlertCircle } from 'lucide-react';
import { saveUserShow, getUserShows, deleteUserShow } from '@/lib/clientDb';

export default function Home() {
  const [topic, setTopic] = useState('The Future of AI and Daily Life');
  const [duration, setDuration] = useState<DurationOption>(3);
  const [language, setLanguage] = useState<LanguageOption>('Hindi');
  const [tone, setTone] = useState<ToneOption>('INFORMATIVE');

  const [currentShow, setCurrentShow] = useState<ShowResponse | null>(null);
  const [history, setHistory] = useState<ShowResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyAllowance, setDailyAllowance] = useState(3);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Load daily allowance & past generated shows from IndexedDB
    try {
      const savedDate = localStorage.getItem('ai_radio_last_date');
      const today = new Date().toDateString();

      if (savedDate !== today) {
        localStorage.setItem('ai_radio_last_date', today);
        localStorage.setItem('ai_radio_allowance', '3');
        setDailyAllowance(3);
      } else {
        const savedAllowance = localStorage.getItem('ai_radio_allowance');
        if (savedAllowance !== null) {
          setDailyAllowance(parseInt(savedAllowance, 10));
        }
      }
    } catch (e) {
      console.warn('Error accessing localStorage for allowance:', e);
    }

    getUserShows()
      .then((shows) => {
        if (shows && shows.length > 0) {
          setHistory(shows);
          setCurrentShow(shows[0]);
        }
      })
      .catch((err) => {
        console.warn('Error loading history from IndexedDB:', err);
      });
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    if (dailyAllowance <= 0) {
      setErrorMsg('Daily allowance limit (3/3) reached for today. Try again tomorrow!');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          duration,
          language,
          tone,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate radio show');
      }

      const showData = (await res.json()) as ShowResponse;
      setCurrentShow(showData);

      // Save to IndexedDB to avoid localStorage size quota limit errors
      await saveUserShow(showData);
      const updatedHistory = [showData, ...history.filter((s) => s.id !== showData.id).slice(0, 9)];
      setHistory(updatedHistory);

      const newAllowance = Math.max(0, dailyAllowance - 1);
      setDailyAllowance(newAllowance);
      try {
        localStorage.setItem('ai_radio_allowance', newAllowance.toString());
      } catch (e) {
        console.warn('Failed to save allowance to localStorage:', e);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while generating the show.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    for (const show of history) {
      await deleteUserShow(show.id);
    }
    setHistory([]);
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteUserShow(id);
    const updated = history.filter((s) => s.id !== id);
    setHistory(updated);
    if (currentShow?.id === id) {
      setCurrentShow(updated.length > 0 ? updated[0] : null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Navigation / Top Branding */}
        <nav className="flex items-center justify-between pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Radio className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <span className="font-bold text-lg text-slate-100 tracking-tight">AI Talk Radio</span>
          </div>
          <div className="text-xs text-slate-400">
            Google AI Studio Clone • Multi-Language
          </div>
        </nav>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Control Panel */}
        <ControlPanel
          topic={topic}
          setTopic={setTopic}
          duration={duration}
          setDuration={setDuration}
          language={language}
          setLanguage={setLanguage}
          tone={tone}
          setTone={setTone}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          dailyAllowance={dailyAllowance}
        />

        {/* Current Radio Show Output */}
        {currentShow && <RadioPlayer show={currentShow} />}

        {/* Recent Shows History */}
        {history.length > 0 && (
          <div className="w-full max-w-4xl mx-auto pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Recent Generated Shows ({history.length})</span>
              </div>
              <button
                onClick={clearHistory}
                className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {history.map((show) => (
                <div
                  key={show.id}
                  onClick={() => setCurrentShow(show)}
                  className={`flex items-center justify-between gap-4 p-3 rounded-xl border text-left cursor-pointer transition ${
                    currentShow?.id === show.id
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-slate-100'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <img
                      src={show.coverImageUrl}
                      alt={show.topic}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                    <div className="overflow-hidden space-y-1">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{show.topic}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5"><Globe className="w-3 h-3 text-pink-400" /> {show.language}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3 text-indigo-400" /> {show.duration} MIN</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteItem(e, show.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition shrink-0"
                    title="Delete show"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        AI Talk Radio • Built with Next.js 14, Gemini 3.0 Flash & Gemini TTS API
      </footer>
    </main>
  );
}
