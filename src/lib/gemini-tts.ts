import { GoogleGenAI } from '@google/genai';
import { getVoiceMapping } from '@/lib/prompts';
import { LanguageOption, ScriptDialogueLine } from '@/types/radio';

interface InteractionItem {
  type?: string;
  mime_type?: string;
  data?: string;
  [key: string]: unknown;
}

interface InteractionStep {
  content?: InteractionItem[];
  [key: string]: unknown;
}

interface InteractionResult {
  steps?: InteractionStep[];
  [key: string]: unknown;
}

export async function generateTTSSpeech(
  dialogue: ScriptDialogueLine[],
  language: LanguageOption
): Promise<Buffer> {
  const { voice: defaultVoice, languageCode } = getVoiceMapping(language);
  const apiKey = process.env.GEMINI_API_KEY;

  const spokenLines = dialogue.filter(
    (line) => line.speaker !== 'CUE' && line.text.trim().length > 0
  );

  if (spokenLines.length === 0) {
    return generateSyntheticAudioBuffer(5);
  }

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const segmentBuffers: Buffer[] = [];

      // Assign voices based on speaker role
      const voiceAssignments: Record<string, string> = {};
      const femaleVoices = ['Kore', 'Aoede'];
      const maleVoices = ['Puck', 'Charon', 'Fenrir'];
      let femaleIndex = 0;
      let maleIndex = 0;

      for (const line of spokenLines) {
        if (!voiceAssignments[line.speaker]) {
          if (line.speaker.toLowerCase().includes('co-host') || line.speaker.toLowerCase().includes('guest')) {
            voiceAssignments[line.speaker] = femaleVoices[femaleIndex++ % femaleVoices.length];
          } else if (line.speaker.toLowerCase().includes('host')) {
            voiceAssignments[line.speaker] = maleVoices[maleIndex++ % maleVoices.length];
          } else {
            voiceAssignments[line.speaker] = defaultVoice;
          }
        }
      }

      // Generate TTS for each line (or in small parallel batches)
      for (const line of spokenLines) {
        const lineVoice = voiceAssignments[line.speaker] || defaultVoice;
        const prompt = `Speak the following line in a natural, engaging radio voice:\n\n${line.text}`;

        try {
          const createParams = {
            model: 'gemini-3.1-flash-tts-preview',
            input: prompt,
            response_modalities: ['audio'],
            generation_config: {
              speech_config: [{ voice: lineVoice, language: languageCode }],
            },
            store: false,
          };

          const interaction = (await ai.interactions.create(
            createParams as unknown as Parameters<typeof ai.interactions.create>[0]
          )) as unknown as InteractionResult;

          let pcmOrWavData: Buffer | null = null;

          if (interaction.steps) {
            for (const step of interaction.steps) {
              for (const item of step.content || []) {
                const itemType = item.type || '';
                const mimeType = item.mime_type || '';
                if (
                  itemType === 'audio' ||
                  (typeof mimeType === 'string' && mimeType.startsWith('audio/'))
                ) {
                  const base64Data = item.data;
                  if (base64Data) {
                    pcmOrWavData = Buffer.from(base64Data, 'base64');
                    break;
                  }
                }
              }
              if (pcmOrWavData) break;
            }
          }

          if (pcmOrWavData) {
            segmentBuffers.push(pcmOrWavData);
          }
        } catch (lineErr) {
          console.warn(`TTS generation failed for line "${line.text.substring(0, 30)}...":`, lineErr);
        }
      }

      if (segmentBuffers.length > 0) {
        return combineWavBuffers(segmentBuffers);
      }
    } catch (err) {
      console.warn('Gemini TTS API call error, generating synthesized audio fallback:', err);
    }
  }

  // Fallback synthetic audio generator
  return generateSyntheticAudioBuffer(spokenLines.length);
}

function combineWavBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 1) return buffers[0];

  const pcmChunks: Buffer[] = [];
  let sampleRate = 24000;
  let numChannels = 1;
  let bitsPerSample = 16;

  for (const buf of buffers) {
    if (buf.length < 44 || buf.toString('utf8', 0, 4) !== 'RIFF') {
      // If it's raw PCM without RIFF header, use the whole buffer
      pcmChunks.push(buf);
      continue;
    }

    // Read header properties from first valid WAV file
    if (pcmChunks.length === 0) {
      numChannels = buf.readUInt16LE(22) || 1;
      sampleRate = buf.readUInt32LE(24) || 24000;
      bitsPerSample = buf.readUInt16LE(34) || 16;
    }

    // Find 'data' chunk
    let dataOffset = 36;
    while (dataOffset < buf.length - 8) {
      if (buf.toString('utf8', dataOffset, dataOffset + 4) === 'data') {
        const chunkLength = buf.readUInt32LE(dataOffset + 4);
        const pcmStart = dataOffset + 8;
        const pcmEnd = Math.min(buf.length, pcmStart + chunkLength);
        pcmChunks.push(buf.subarray(pcmStart, pcmEnd));
        break;
      }
      dataOffset += 1;
    }

    // Fallback if data chunk tag not explicitly found
    if (dataOffset >= buf.length - 8) {
      pcmChunks.push(buf.subarray(44));
    }
  }

  const totalPcmSize = pcmChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + totalPcmSize, 4);
  header.write('WAVE', 8);

  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20);  // AudioFormat (PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34);

  header.write('data', 36);
  header.writeUInt32LE(totalPcmSize, 40);

  return Buffer.concat([header, ...pcmChunks]);
}

function generateSyntheticAudioBuffer(linesCount: number): Buffer {
  const sampleRate = 24000;
  const durationSeconds = Math.max(5, Math.min(linesCount * 3, 30));
  const numSamples = sampleRate * durationSeconds;
  const dataSize = numSamples * 2;
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write('WAVE', 8);

  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);

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
