'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, FileText, Music2, Clock } from 'lucide-react';
import { ShowResponse } from '@/types/radio';

interface PlayerProps {
  show: ShowResponse;
}

export function RadioPlayer({ show }: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'player' | 'script'>('player');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [show]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Tab Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('player')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'player'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Music2 className="w-4 h-4" />
            <span>Radio Broadcast</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'script'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Show Script & Dialogue</span>
          </button>
        </div>

        {/* Download Audio Button */}
        <a
          href={show.audioUrl}
          download={`AI_Talk_Radio_${show.topic.replace(/\s+/g, '_')}.mp3`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Download Audio</span>
        </a>
      </div>

      {activeTab === 'player' ? (
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Cover Art Display */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="relative group w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden shadow-2xl border border-indigo-500/20 bg-slate-950">
              {/* Cover Image */}
              <img
                src={show.coverImageUrl}
                alt={show.topic}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

              {/* Equalizer animation when playing */}
              {isPlaying && (
                <div className="absolute bottom-4 left-4 flex items-end gap-1">
                  <div className="w-1.5 h-6 bg-pink-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-8 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-4 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  <div className="w-1.5 h-7 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                </div>
              )}
            </div>
          </div>

          {/* Show Info & Player Controls */}
          <div className="md:col-span-7 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wider uppercase">
                  {show.language}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {show.duration} MIN (~{show.wordCount} words)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                  {show.tone}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 leading-tight">
                {show.topic}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Generated episode with speech voice synthesis and background music loop
              </p>
            </div>

            {/* Hidden Audio Element */}
            <audio
              ref={audioRef}
              src={show.audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Time / Seekbar */}
            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback & Volume Control Row */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition transform active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  )}
                </button>
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    {isPlaying ? 'Now Playing' : 'Ready to Broadcast'}
                  </div>
                  <div className="text-xs text-slate-400">AI Talk Radio Host</div>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-slate-400 hover:text-slate-200">
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Show Script Tab */
        <div className="p-6 max-h-[500px] overflow-y-auto space-y-4 text-sm leading-relaxed text-slate-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-semibold text-slate-200">Full Transcript ({show.language})</h3>
            <span className="text-xs text-slate-500">{show.wordCount} words</span>
          </div>

          <div className="space-y-3 font-sans">
            {show.dialogue.map((line, idx) => {
              if (line.speaker === 'CUE' || line.cue) {
                return (
                  <div key={idx} className="px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 text-xs font-mono font-medium my-2">
                    🎵 {line.cue || line.text}
                  </div>
                );
              }
              const isHost = line.speaker.toLowerCase().includes('host');
              return (
                <div key={idx} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isHost ? 'text-indigo-400' : 'text-purple-400'}`}>
                    {line.speaker}
                  </span>
                  <p className="text-slate-200">{line.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
