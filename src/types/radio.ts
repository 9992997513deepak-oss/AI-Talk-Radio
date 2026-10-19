export type NavSection =
  | 'dashboard'
  | 'create'
  | 'episodes'
  | 'script-studio'
  | 'audio-editor'
  | 'hosts-voices'
  | 'music-sfx'
  | 'video-studio'
  | 'youtube-toolkit'
  | 'templates'
  | 'settings';

export type LanguageOption =
  | 'Hindi'
  | 'Hinglish'
  | 'English'
  | 'Marathi'
  | 'Tamil'
  | 'Bengali'
  | 'Gujarati';

export type PodcastFormat =
  | 'Real FM Radio Talk Show'
  | 'Trending Topics Discussion'
  | 'Horror and Mystery'
  | 'True Stories and Investigations'
  | 'History and Historical Personalities'
  | 'Science and Technology'
  | 'AI and Future Technology'
  | 'Business and Money'
  | 'Motivation and Self-Improvement'
  | 'Relationships and Human Psychology'
  | 'Entertainment and Pop Culture'
  | 'Funny Conversations'
  | 'Travel and Culture'
  | 'Documentary Podcast'
  | 'Interview and Guest Discussion'
  | 'News Explainer'
  | 'Educational Podcast'
  | 'Late-Night Radio'
  | 'Custom Topic';

export type DurationOption = 1 | 3 | 5 | 10 | 15 | 20 | 30 | 45 | 60;

export type ToneOption =
  | 'INFORMATIVE'
  | 'ENTERTAINING'
  | 'CASUAL'
  | 'DRAMATIC'
  | 'EDUCATIONAL'
  | 'FUNNY'
  | 'MYSTERIOUS'
  | 'INSPIRATIONAL';

export interface SingleHostConfig {
  name: string;
  voice: string;
  personality: string;
  speed: number;
  pitch: number;
  role: string;
  avatarUrl?: string;
  gender: 'male' | 'female';
}

export interface HostConfig {
  maleHost: SingleHostConfig;
  femaleHost: SingleHostConfig;
}

export interface ScriptDialogueLine {
  id: string;
  speaker: string;
  speakerGender?: 'male' | 'female' | 'cue';
  text: string;
  cue?: string;
  audioUrl?: string;
  status?: 'pending' | 'generating' | 'done' | 'error';
  durationSec?: number;
}

export interface YouTubeMetadata {
  titles: string[];
  description: string;
  chapters: { time: string; text: string }[];
  tags: string[];
  hashtags: string[];
  thumbnailConcepts: string[];
  shortsMoments: string[];
  pinnedComment: string;
}

export type GenerationJobStatus =
  | 'draft'
  | 'script-ready'
  | 'queued'
  | 'generating-audio' | 'processing-segments'
  | 'mixing'
  | 'ready'
  | 'exporting'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled';

export interface ShowResponse {
  id: string;
  title: string;
  topic: string;
  instructions?: string;
  targetAudience?: string;
  duration: number;
  language: LanguageOption;
  format: PodcastFormat;
  tone: ToneOption;
  hosts: HostConfig;
  wordCount: number;
  estimatedDurationSec: number;
  actualDurationSec?: number;
  script: string;
  dialogue: ScriptDialogueLine[];
  audioUrl: string;
  coverImageUrl: string;
  musicTrack?: string;
  musicVolume?: number;
  speechVolume?: number;
  status: GenerationJobStatus;
  currentSegmentIndex?: number;
  totalSegments?: number;
  folder?: string;
  isFavorite?: boolean;
  youtubeMetadata?: YouTubeMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateShowRequest {
  title?: string;
  topic: string;
  instructions?: string;
  targetAudience?: string;
  duration: number;
  language: LanguageOption;
  format: PodcastFormat;
  tone: ToneOption;
  hosts?: HostConfig;
  musicTrack?: string;
}

export interface VoiceMapping {
  maleVoice: string;
  femaleVoice: string;
  languageCode: string;
}

export interface FolderItem {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface HostPreset {
  id: string;
  name: string;
  hosts: HostConfig;
  isDefault?: boolean;
}
