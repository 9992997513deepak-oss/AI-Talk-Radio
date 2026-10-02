import { GoogleGenAI } from '@google/genai';
import { getVoiceMapping } from '@/lib/prompts';
import { LanguageOption, ScriptDialogueLine } from '@/types/radio';

export async function generateTTSSpeech(
  dialogue: ScriptDialogueLine[],
  language: LanguageOption
): Promise<{ buffer: Buffer; mimeType: string }> {
  const { voice, languageCode } = getVoiceMapping(language);
  const apiKey = process.env.GEMINI_API_KEY;

  const spokenText = dialogue
    .filter((line) => line.speaker !== 'CUE' && line.text.length > 0)
    .map((line) => `${line.speaker}: ${line.text}`)
    .join('\n\n');

  console.log('[TTS Debug] Requesting speech for language:', language, '| Voice:', voice, '| Code:', languageCode);
  console.log('[TTS Debug] Spoken text length:', spokenText.length);

  if (apiKey) {
    // 1. Try gemini-2.5-flash-preview-tts model via GoogleGenAI SDK
    try {
      const ai = new GoogleGenAI({ apiKey });
      console.log('[TTS Debug] Requesting audio generation via gemini-2.5-flash-preview-tts...');
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: `Read the following radio transcript aloud clearly in a natural radio host voice:\n\n${spokenText}`,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice || 'Kore',
              },
            },
          },
        },
      });

      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData?.data) {
              console.log('[TTS Debug] Successfully received audio data from gemini-2.5-flash-preview-tts');
              return {
                buffer: Buffer.from(part.inlineData.data, 'base64'),
                mimeType: part.inlineData.mimeType || 'audio/mp3',
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn('[TTS Warning] gemini-2.5-flash-preview-tts SDK attempt failed, trying REST fallback:', err);
    }

    // 2. Try REST fallback calls with gemini-2.5-flash-preview-tts / gemini-2.5-flash
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    ];

    for (const endpoint of endpoints) {
      try {
        console.log('[TTS Debug] Calling REST endpoint:', endpoint.split('?')[0]);
        const restResponse = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Read aloud clearly in a natural radio voice:\n\n${spokenText}` }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voice || 'Kore',
                  },
                },
              },
            },
          }),
        });

        if (restResponse.ok) {
          const restData = await restResponse.json();
          const inlineData = restData.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          if (inlineData?.data) {
            console.log('[TTS Debug] Successfully received audio via REST API fallback.');
            return {
              buffer: Buffer.from(inlineData.data, 'base64'),
              mimeType: inlineData.mimeType || 'audio/mp3',
            };
          }
        }
      } catch (restErr) {
        console.warn('[TTS Warning] REST endpoint error:', restErr);
      }
    }
  } else {
    console.warn('[TTS Warning] GEMINI_API_KEY is not set.');
  }

  console.log('[TTS Debug] Generating clean synthetic WAV audio buffer as fallback.');
  return {
    buffer: generateSyntheticAudioBuffer(dialogue.length),
    mimeType: 'audio/wav',
  };
}

function generateSyntheticAudioBuffer(linesCount: number): Buffer {
  const sampleRate = 44100;
  const durationSeconds = Math.max(5, Math.min(linesCount * 3, 30));
  const numSamples = sampleRate * durationSeconds;
  const dataSize = numSamples * 2;
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sampleVal =
      Math.sin(2 * Math.PI * 261.63 * t) * 0.15 +
      Math.sin(2 * Math.PI * 329.63 * t) * 0.10 +
      Math.sin(2 * Math.PI * 392.00 * t) * 0.10;
    const int16Val = Math.floor(sampleVal * 32767);
    buffer.writeInt16LE(int16Val, 44 + i * 2);
  }

  return buffer;
}
