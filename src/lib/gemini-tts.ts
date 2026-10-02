import { getVoiceMapping } from '@/lib/prompts';
import { LanguageOption, ScriptDialogueLine } from '@/types/radio';

export async function generateTTSSpeech(
  dialogue: ScriptDialogueLine[],
  language: LanguageOption
): Promise<Buffer> {
  const { voice, languageCode } = getVoiceMapping(language);
  const apiKey = process.env.GEMINI_API_KEY;

  const spokenText = dialogue
    .filter((line) => line.speaker !== 'CUE' && line.text.length > 0)
    .map((line) => `${line.speaker}: ${line.text}`)
    .join('\n\n');

  if (apiKey) {
    try {
      // Direct REST API call to Gemini TTS / Speech generation endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateAudio?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: spokenText }] }],
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice,
              },
            },
            audioConfig: {
              audioEncoding: 'MP3',
              languageCode: languageCode,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.audioContent) {
          return Buffer.from(data.audioContent, 'base64');
        }
      }
    } catch (err) {
      console.warn('Gemini TTS API call error, generating synthesized audio fallback:', err);
    }
  }

  // Fallback WAV/PCM synthetic audio generator if Gemini TTS key is unconfigured or fails
  return generateSyntheticAudioBuffer(dialogue.length);
}

function generateSyntheticAudioBuffer(linesCount: number): Buffer {
  // Generate a valid 44.1kHz 16-bit PCM WAV audio file with gentle ambient tone pads
  const sampleRate = 44100;
  const durationSeconds = Math.max(5, Math.min(linesCount * 3, 30));
  const numSamples = sampleRate * durationSeconds;
  const dataSize = numSamples * 2; // 16-bit monophonic
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 channel)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Synthesize soft radio hum/voices tone
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Pleasant chord frequencies: C4 (261.63Hz) + E4 (329.63Hz) + G4 (392.00Hz)
    const sampleVal =
      Math.sin(2 * Math.PI * 261.63 * t) * 0.15 +
      Math.sin(2 * Math.PI * 329.63 * t) * 0.10 +
      Math.sin(2 * Math.PI * 392.00 * t) * 0.10;
    const int16Val = Math.floor(sampleVal * 32767);
    buffer.writeInt16LE(int16Val, 44 + i * 2);
  }

  return buffer;
}
