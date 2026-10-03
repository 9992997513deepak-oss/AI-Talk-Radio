import { LanguageOption, ScriptDialogueLine } from '@/types/radio';
import { generateSpeech } from '@/lib/edgeTts';

export async function generateTTSSpeech(
  dialogue: ScriptDialogueLine[],
  language: LanguageOption
): Promise<Buffer> {
  const spokenLines = dialogue.filter(
    (line) => line.speaker !== 'CUE' && line.text.trim().length > 0
  );

  if (spokenLines.length === 0) {
    return (await generateSpeech('Welcome to AI Talk Radio.', 'english_female')) as Buffer;
  }

  const segmentBuffers: Buffer[] = [];

  for (const line of spokenLines) {
    let voiceType = 'hindi_female';
    const isHost = line.speaker.toLowerCase().includes('host') && !line.speaker.toLowerCase().includes('co-host');

    if (language === 'English') {
      voiceType = isHost ? 'english_male' : 'english_female';
    } else if (language === 'Hindi' || language === 'Hinglish') {
      voiceType = isHost ? 'hindi_male' : 'hindi_female';
    } else if (language === 'Marathi') {
      voiceType = 'marathi_female';
    } else if (language === 'Tamil') {
      voiceType = 'tamil_female';
    } else if (language === 'Bengali') {
      voiceType = 'bengali_female';
    } else if (language === 'Gujarati') {
      voiceType = 'gujarati_female';
    }

    try {
      const speechResult = await generateSpeech(line.text, voiceType);
      if (Buffer.isBuffer(speechResult)) {
        segmentBuffers.push(speechResult);
      }
    } catch (lineErr) {
      console.warn(`Edge TTS generation failed for line "${line.text.substring(0, 30)}...":`, lineErr);
    }
  }

  if (segmentBuffers.length > 0) {
    return Buffer.concat(segmentBuffers);
  }

  return (await generateSpeech('Welcome to AI Talk Radio.', 'english_female')) as Buffer;
}
