import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ScriptDialogueLine, LanguageOption } from '@/types/radio';
import { GoogleGenAI } from '@google/genai';

const execAsync = promisify(exec);

export function selectVoiceForLine(line: ScriptDialogueLine, language: LanguageOption): string {
  const isFemale = line.speakerGender === 'female' ||
    line.speaker.toLowerCase().includes('female') ||
    line.speaker.toLowerCase().includes('ananya') ||
    line.speaker.toLowerCase().includes('co-host');

  if (language === 'Hindi' || language === 'Hinglish') {
    return isFemale ? 'hi-IN-SwaraNeural' : 'hi-IN-MadhurNeural';
  } else if (language === 'English') {
    return isFemale ? 'en-IN-NeerjaNeural' : 'en-IN-PrabhatNeural';
  } else if (language === 'Marathi') {
    return isFemale ? 'mr-IN-AarohiNeural' : 'mr-IN-ManoharNeural';
  } else if (language === 'Tamil') {
    return isFemale ? 'ta-IN-PallaviNeural' : 'ta-IN-ValluvarNeural';
  } else if (language === 'Bengali') {
    return isFemale ? 'bn-IN-TanishaaNeural' : 'bn-IN-BashkarNeural';
  } else if (language === 'Gujarati') {
    return isFemale ? 'gu-IN-DhwaniNeural' : 'gu-IN-NiranjanNeural';
  }

  return isFemale ? 'hi-IN-SwaraNeural' : 'hi-IN-MadhurNeural';
}

export async function generateSingleLineTTS(
  line: ScriptDialogueLine,
  language: LanguageOption,
  customVoice?: string
): Promise<Buffer> {
  if (!line.text || line.text.trim().length === 0 || line.speaker === 'CUE') {
    return generateSyntheticAudioBuffer(1);
  }

  const voice = customVoice || selectVoiceForLine(line, language);
  const textClean = line.text.replace(/["'\n]/g, ' ').trim();

  // Try Python edge-tts execution with full try-catch & error logging
  try {
    const tmpDir = os.tmpdir();
    const outputFile = path.join(tmpDir, `tts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp3`);

    const pythonScript = `
import asyncio
import edge_tts

async def run():
    communicate = edge_tts.Communicate('''${textClean}''', '${voice}')
    await communicate.save('${outputFile}')

asyncio.run(run())
`;
    const pyFilePath = path.join(tmpDir, `script_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.py`);
    await fs.promises.writeFile(pyFilePath, pythonScript, 'utf8');

    await execAsync(`python3 "${pyFilePath}"`);

    if (fs.existsSync(outputFile)) {
      const buffer = await fs.promises.readFile(outputFile);
      fs.promises.unlink(pyFilePath).catch(() => {});
      fs.promises.unlink(outputFile).catch(() => {});
      return buffer;
    }
  } catch (edgeErr) {
    console.error('Edge-TTS error:', edgeErr);
  }

  // Fallback to Gemini TTS API if GEMINI_API_KEY is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Speak this line in a clear, natural radio presenter tone:\n\n${textClean}`;

      const interaction = (await ai.interactions.create({
        model: 'gemini-3.1-flash-tts-preview',
        input: prompt,
        response_modalities: ['audio'],
        generation_config: {
          speech_config: [{ voice: line.speakerGender === 'female' ? 'Kore' : 'Puck', language: 'hi-IN' }],
        },
        store: false,
      })) as unknown as { steps?: { content?: { type?: string; mime_type?: string; data?: string }[] }[] };

      if (interaction.steps) {
        for (const step of interaction.steps) {
          for (const item of step.content || []) {
            if (item.type === 'audio' || (item.mime_type && item.mime_type.startsWith('audio/'))) {
              if (item.data) {
                return Buffer.from(item.data, 'base64');
              }
            }
          }
        }
      }
    } catch (geminiErr) {
      console.error('Gemini TTS API call error:', geminiErr);
    }
  }

  return generateSyntheticAudioBuffer(3);
}

export async function generateBatchDialogueTTS(
  dialogue: ScriptDialogueLine[],
  language: LanguageOption
): Promise<ScriptDialogueLine[]> {
  const updatedDialogue: ScriptDialogueLine[] = [];

  for (const line of dialogue) {
    if (line.speaker === 'CUE' || !line.text.trim()) {
      updatedDialogue.push(line);
      continue;
    }

    try {
      const audioBuffer = await generateSingleLineTTS(line, language);
      const base64Data = audioBuffer.toString('base64');
      const audioUrl = `data:audio/mp3;base64,${base64Data}`;

      updatedDialogue.push({
        ...line,
        audioUrl,
        status: 'done',
        durationSec: Math.max(2, Math.ceil(line.text.length / 15)),
      });
    } catch (err) {
      console.error(`Failed TTS for line ${line.id}:`, err);
      updatedDialogue.push({
        ...line,
        status: 'error',
      });
    }
  }

  return updatedDialogue;
}

export async function generateTTSSpeech(
  dialogue: ScriptDialogueLine[],
  language: LanguageOption
): Promise<Buffer> {
  const spokenLines = dialogue.filter((l) => l.speaker !== 'CUE' && l.text.trim().length > 0);
  if (spokenLines.length === 0) {
    return generateSyntheticAudioBuffer(5);
  }

  const lineBuffers: Buffer[] = [];
  for (const line of spokenLines) {
    const buf = await generateSingleLineTTS(line, language);
    lineBuffers.push(buf);
  }

  return Buffer.concat(lineBuffers);
}

function generateSyntheticAudioBuffer(durationSeconds: number): Buffer {
  const sampleRate = 24000;
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
    const sampleVal = Math.sin(2 * Math.PI * 300 * t) * 0.1;
    const int16Val = Math.floor(sampleVal * 32767);
    buffer.writeInt16LE(int16Val, 44 + i * 2);
  }

  return buffer;
}
