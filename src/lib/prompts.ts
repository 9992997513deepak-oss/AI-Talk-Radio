import { LanguageOption, PodcastFormat, ToneOption, HostConfig, VoiceMapping } from '@/types/radio';

export function getTargetWordCount(durationMinutes: number): number {
  return durationMinutes * 150;
}

export function getVoiceMapping(language: LanguageOption): VoiceMapping {
  switch (language) {
    case 'Hindi':
      return { maleVoice: 'hi-IN-MadhurNeural', femaleVoice: 'hi-IN-SwaraNeural', languageCode: 'hi-IN' };
    case 'English':
      return { maleVoice: 'en-IN-PrabhatNeural', femaleVoice: 'en-IN-NeerjaNeural', languageCode: 'en-IN' };
    case 'Hinglish':
      return { maleVoice: 'hi-IN-MadhurNeural', femaleVoice: 'hi-IN-SwaraNeural', languageCode: 'hi-IN' };
    default:
      return { maleVoice: 'hi-IN-MadhurNeural', femaleVoice: 'hi-IN-SwaraNeural', languageCode: 'hi-IN' };
  }
}

export function buildScriptPrompt(
  topic: string,
  durationMinutes: number,
  language: LanguageOption,
  format: PodcastFormat = 'Real FM Radio Talk Show',
  tone: ToneOption = 'INFORMATIVE',
  hosts?: HostConfig,
  instructions?: string,
  targetAudience?: string
): string {
  const targetWords = getTargetWordCount(durationMinutes);
  const maleName = hosts?.maleHost?.name || 'Aryan';
  const femaleName = hosts?.femaleHost?.name || 'Ananya';

  let languageInstruction = '';
  switch (language) {
    case 'Hindi':
      languageInstruction = 'Generate the entire radio show script in authentic conversational Hindi (Devanagari script). Presenters sound like real energetic Indian RJs.';
      break;
    case 'Hinglish':
      languageInstruction = 'Generate the script in natural Hinglish (Hindi + English mix written in Roman script), lively conversational radio style.';
      break;
    case 'English':
      languageInstruction = 'Generate the script in fluent, engaging English with a dynamic radio talk show flow.';
      break;
    default:
      languageInstruction = 'Generate the entire script in authentic conversational Hindi (Devanagari script).';
  }

  return `You are a world-class AI Radio Producer creating a show for "RadioVerse AI".

SHOW METADATA:
- Topic: ${topic}
- Format: ${format}
- Target Duration: ${durationMinutes} minutes (~${targetWords} words)
- Tone / Energy: ${tone}
- Language Style: ${languageInstruction}
${instructions ? `- Instructions: ${instructions}` : ''}
${targetAudience ? `- Audience: ${targetAudience}` : ''}

PRESENTERS:
1. ${maleName} (Male Host)
2. ${femaleName} (Female Host)

FORMAT REQUIREMENTS:
Format speaker lines strictly as:
${maleName} (Male Host): <dialogue text>
${femaleName} (Female Host): <dialogue text>
[MUSIC CUE: <description>]

Generate the full radio script now.`;
}
