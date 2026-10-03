import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import path from 'path';

export const VOICES: Record<string, string> = {
  hindi_female: "hi-IN-SwaraNeural",
  hindi_male: "hi-IN-PrabhatNeural",
  english_female: "en-US-AriaNeural",
  english_male: "en-US-GuyNeural",
  marathi_female: "mr-IN-AarohiNeural",
  tamil_female: "ta-IN-PallaviNeural",
  bengali_female: "bn-IN-TanishaaNeural",
  gujarati_female: "gu-IN-DhwaniNeural",
};

export async function generateSpeech(
  text: string,
  voiceType: string = "hindi_female",
  fileName?: string
): Promise<string | Buffer> {
  const voice = VOICES[voiceType] || VOICES.hindi_female;
  const lang = voice.split('-').slice(0, 2).join('-');

  const tts = new EdgeTTS({
    voice,
    lang,
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
  });

  const targetFile = fileName || path.join('/tmp', `tts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp3`);
  await tts.ttsPromise(text, targetFile);

  if (fileName) {
    return fileName;
  } else {
    const buffer = await fs.promises.readFile(targetFile);
    try {
      await fs.promises.unlink(targetFile);
    } catch {
      // ignore
    }
    return buffer;
  }
}

export async function generateLongShow(
  scriptParts: Array<{ text: string; voice?: string }>,
  outputPath?: string
): Promise<string[]> {
  const tempFiles: string[] = [];
  for (let i = 0; i < scriptParts.length; i++) {
    const part = scriptParts[i];
    const tempFile = path.join('/tmp', `part_${i}_${Date.now()}.mp3`);
    await generateSpeech(part.text, part.voice || "hindi_female", tempFile);
    tempFiles.push(tempFile);
  }

  if (outputPath && tempFiles.length > 0) {
    const buffers: Buffer[] = [];
    for (const f of tempFiles) {
      buffers.push(await fs.promises.readFile(f));
    }
    const combined = Buffer.concat(buffers);
    await fs.promises.writeFile(outputPath, combined);
  }

  return tempFiles;
}
