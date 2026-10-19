export async function mixFullShowAudio(
  dialogue: unknown[],
  voiceBuffer: Buffer,
  musicBuffer: Buffer,
  musicVolume = 0.15,
  speechVolume = 1.0
): Promise<Buffer> {
  try {
    if (!voiceBuffer || voiceBuffer.length < 44) return musicBuffer || voiceBuffer;
    if (!musicBuffer || musicBuffer.length < 44) return voiceBuffer;

    const isVoiceWav = voiceBuffer.toString('utf8', 0, 4) === 'RIFF';
    const voicePcm = isVoiceWav ? voiceBuffer.subarray(44) : voiceBuffer;

    const isMusicWav = musicBuffer.toString('utf8', 0, 4) === 'RIFF';
    const musicPcm = isMusicWav ? musicBuffer.subarray(44) : musicBuffer;

    const voiceSamplesCount = Math.floor(voicePcm.length / 2);
    const musicSamplesCount = Math.floor(musicPcm.length / 2);
    const mixedPcm = Buffer.alloc(voicePcm.length);

    for (let i = 0; i < voiceSamplesCount; i++) {
      const voiceSample = voicePcm.readInt16LE(i * 2) * speechVolume;
      const musicIdx = musicSamplesCount > 0 ? (i % musicSamplesCount) * 2 : 0;
      const musicSample = musicSamplesCount > 0 ? musicPcm.readInt16LE(musicIdx) : 0;

      const mixed = Math.max(-32768, Math.min(32767, Math.floor(voiceSample + musicSample * musicVolume)));
      mixedPcm.writeInt16LE(mixed, i * 2);
    }

    const sampleRate = isVoiceWav ? voiceBuffer.readUInt32LE(24) : 24000;
    const header = Buffer.alloc(44);
    const fileSize = 44 + mixedPcm.length;

    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize - 8, 4);
    header.write('WAVE', 8);

    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(1, 22); // Mono
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * 2, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);

    header.write('data', 36);
    header.writeUInt32LE(mixedPcm.length, 40);

    return Buffer.concat([header, mixedPcm]);
  } catch (err) {
    console.warn('In-memory voice & music mixing failed, returning voice buffer directly:', err);
    return voiceBuffer;
  }
}
