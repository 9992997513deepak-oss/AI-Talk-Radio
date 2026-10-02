import { LanguageOption, ToneOption, VoiceMapping } from '@/types/radio';

export function getTargetWordCount(durationMinutes: number): number {
  return durationMinutes * 150;
}

export function getVoiceMapping(language: LanguageOption): VoiceMapping {
  switch (language) {
    case 'Hindi':
      return { voice: 'Kore', languageCode: 'hi-IN' };
    case 'English':
      return { voice: 'Paul', languageCode: 'en-US' };
    case 'Hinglish':
      return { voice: 'Kore', languageCode: 'hi-IN' };
    case 'Marathi':
    case 'Tamil':
    case 'Bengali':
    case 'Gujarati':
    default:
      return { voice: 'Kore', languageCode: 'hi-IN' };
  }
}

export function buildScriptPrompt(
  topic: string,
  durationMinutes: number,
  language: LanguageOption,
  tone: ToneOption
): string {
  const targetWords = getTargetWordCount(durationMinutes);

  let languageInstruction = '';
  switch (language) {
    case 'Hindi':
      languageInstruction = 'Generate the entire radio show script in pure Hindi language (Devanagari script), engaging radio style.';
      break;
    case 'Hinglish':
      languageInstruction = 'Generate the entire radio show script in Hinglish (Hindi + English mix written in Roman script), lively conversational radio style.';
      break;
    case 'English':
      languageInstruction = 'Generate the entire radio show script in fluent English, professional radio broadcast style.';
      break;
    case 'Marathi':
      languageInstruction = 'Generate the entire radio show script in Marathi language (Devanagari script), engaging radio style.';
      break;
    case 'Tamil':
      languageInstruction = 'Generate the entire radio show script in Tamil language, engaging radio style.';
      break;
    case 'Bengali':
      languageInstruction = 'Generate the entire radio show script in Bengali language, engaging radio style.';
      break;
    case 'Gujarati':
      languageInstruction = 'Generate the entire radio show script in Gujarati language, engaging radio style.';
      break;
    default:
      languageInstruction = 'Generate the entire radio show script in pure Hindi language (Devanagari script), engaging radio style.';
  }

  return `You are a world-class AI Radio Host producing a top-rated talk radio episode.

SHOW CONFIGURATION:
- Topic: ${topic}
- Target Duration: ${durationMinutes} minutes
- Target Word Count: approximately ${targetWords} words (calculated at ~150 words per minute)
- Tone / Vibe: ${tone}
- Language Instruction: ${languageInstruction}

REQUIREMENTS:
1. ${languageInstruction}
2. Structure the script as a natural, engaging talk radio podcast show featuring a main Host (and co-host/guest where appropriate) or a single charismatic Host.
3. Include occasional inline sound/music cues placed on their own line or in brackets, such as [MUSIC CUE], [SFX: INTRO JINGLE], [SFX: APPLAUSE], or [MUSIC CUE: FADE IN SOFT UPBEAT TRACK].
4. Format speaker lines clearly as:
Host: <speech text>
Co-Host: <speech text>
5. Keep the total length around ${targetWords} words so it fits exactly ${durationMinutes} minutes of radio broadcasting.
6. Make the intro punchy, the content informative and entertaining according to tone "${tone}", and end with a smooth radio outro.

Generate the full radio script now.`;
}
