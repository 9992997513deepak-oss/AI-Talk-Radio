export type LanguageOption =
  | 'Hindi'
  | 'English'
  | 'Hinglish'
  | 'Marathi'
  | 'Tamil'
  | 'Bengali'
  | 'Gujarati';

export type DurationOption = 3 | 5 | 8 | 10 | 15;

export type ToneOption = 'INFORMATIVE' | 'ENTERTAINING' | 'CASUAL' | 'DRAMATIC' | 'EDUCATIONAL';

export interface GenerateShowRequest {
  topic: string;
  duration: DurationOption;
  language: LanguageOption;
  tone: ToneOption;
}

export interface ScriptDialogueLine {
  speaker: string;
  text: string;
  cue?: string;
}

export interface ShowResponse {
  id: string;
  topic: string;
  duration: DurationOption;
  language: LanguageOption;
  tone: ToneOption;
  wordCount: number;
  script: string;
  dialogue: ScriptDialogueLine[];
  audioUrl: string; // base64 data URI or hosted URL
  coverImageUrl: string;
  createdAt: string;
}

export interface VoiceMapping {
  voice: string;
  languageCode: string;
}
