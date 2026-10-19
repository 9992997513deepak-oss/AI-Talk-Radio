import { GoogleGenAI } from '@google/genai';
import { YouTubeMetadata } from '@/types/radio';

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

export async function generateBackgroundMusic(topic: string, tone: string): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Create a 30-second subtle ambient talk radio show intro track for topic: ${topic}, tone: ${tone}. Clean synths, warm beats, instrumental only.`;

      const interaction = (await ai.interactions.create({
        model: 'lyria-3-clip-preview',
        input: prompt,
        store: false,
      })) as unknown as InteractionResult;

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
                return Buffer.from(base64Data, 'base64');
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Lyria API call failed, generating synthetic background music loop:', err);
    }
  }

  return generateSyntheticMusicLoop();
}

function generateSyntheticMusicLoop(): Buffer {
  const sampleRate = 24000;
  const durationSeconds = 15;
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
    const beat = Math.sin(2 * Math.PI * 2 * t);
    const synthPad =
      Math.sin(2 * Math.PI * 130.81 * t) * 0.12 +
      Math.sin(2 * Math.PI * 164.81 * t) * 0.08 +
      Math.sin(2 * Math.PI * 196.00 * t) * 0.08;

    const sampleVal = synthPad * (0.6 + 0.4 * beat);
    const int16Val = Math.floor(sampleVal * 32767);
    buffer.writeInt16LE(int16Val, 44 + i * 2);
  }

  return buffer;
}

export async function mixVoiceAndMusic(voiceBuffer: Buffer, musicBuffer: Buffer): Promise<Buffer> {
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
      const voiceSample = voicePcm.readInt16LE(i * 2);
      const musicIdx = musicSamplesCount > 0 ? (i % musicSamplesCount) * 2 : 0;
      const musicSample = musicSamplesCount > 0 ? musicPcm.readInt16LE(musicIdx) : 0;

      const mixed = Math.max(-32768, Math.min(32767, Math.floor(voiceSample + musicSample * 0.15)));
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
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
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

export async function generateCoverArt(topic: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `A professional podcast cover image for a show titled "${topic}" on "AI Talk Radio". Vibrant background, clean aesthetic, 1:1 aspect ratio.`;

      const createParams = {
        model: 'gemini-3.1-flash-image',
        input: prompt,
        response_format: { type: 'image' },
      };

      const interaction = (await ai.interactions.create(
        createParams as unknown as Parameters<typeof ai.interactions.create>[0]
      )) as unknown as InteractionResult;

      if (interaction.steps) {
        for (const step of interaction.steps) {
          for (const item of step.content || []) {
            const itemType = item.type || '';
            const mimeType = item.mime_type || '';
            if (
              itemType === 'image' ||
              (typeof mimeType === 'string' && mimeType.startsWith('image/'))
            ) {
              const base64Data = item.data;
              if (base64Data) {
                return `data:${mimeType || 'image/png'};base64,${base64Data}`;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Gemini Flash Image generation failed, returning generated SVG visual cover art:', err);
    }
  }

  const titleText = topic.length > 28 ? topic.substring(0, 25) + '...' : topic;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="50%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#311042"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#6366f1"/>
        <stop offset="100%" stop-color="#a855f7"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#bg)"/>
    <circle cx="300" cy="240" r="140" fill="none" stroke="url(#accent)" stroke-width="4" opacity="0.6"/>
    <circle cx="300" cy="240" r="100" fill="none" stroke="#818cf8" stroke-dasharray="10 10" stroke-width="2" opacity="0.8"/>
    <g transform="translate(250, 180) scale(2)" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" fill="#f43f5e" fill-opacity="0.2"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </g>
    <path d="M 210 240 A 90 90 0 0 1 210 200" fill="none" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/>
    <path d="M 390 200 A 90 90 0 0 1 390 240" fill="none" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/>
    <rect x="210" y="380" width="180" height="32" rx="16" fill="url(#accent)"/>
    <text x="300" y="401" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">AI TALK RADIO</text>
    <text x="300" y="460" font-family="system-ui, sans-serif" font-size="28" font-weight="800" fill="#f8fafc" text-anchor="middle">${escapeXml(titleText)}</text>
    <text x="300" y="495" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">LIVE BROADCAST • GEMINI STUDIO</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateYouTubeMetadata(topic: string, lang: string): YouTubeMetadata {
  return {
    titles: [
      `🔥 ${topic} — Full ${lang} Radio Show | RadioVerse AI`,
      `Mind-Blowing Facts About ${topic}! (Podcast ${lang})`,
      `${topic} Explained | RadioVerse AI Episode`,
      `What Everyone Needs to Know About ${topic}!`,
      `The Ultimate ${topic} Discussion | ${lang} AI Podcast`,
    ],
    description: `Welcome to RadioVerse AI! In this special podcast episode, Aryan and Ananya decode everything you need to know about "${topic}".\n\n00:00 Intro & Welcome\n00:30 Opening Hook & Context\n02:00 Main Discussion & Analysis\n04:30 Key Takeaways & Audience Q&A\n05:30 Final Thoughts & Outro\n\n#RadioVerseAI #${topic.replace(/\s+/g, '')} #HindiPodcast #AIPodcast #TrendingNews`,
    chapters: [
      { time: '00:00', text: 'Intro & Welcome to RadioVerse AI' },
      { time: '00:30', text: 'Opening Hook & Topic Introduction' },
      { time: '02:00', text: 'Deep Dive Discussion & Analysis' },
      { time: '04:30', text: 'Key Takeaways & Future Impact' },
      { time: '05:30', text: 'Conclusion & Pinned Comment' },
    ],
    tags: [topic, 'RadioVerse AI', 'Hindi Podcast', 'AI Voice', 'Talk Radio', 'Podcast Show', 'Indian Creators', 'YouTube Shorts', 'Trending Topic'],
    hashtags: ['#RadioVerseAI', `#${topic.replace(/\s+/g, '')}`, '#HindiPodcast', '#AIStudio', '#PodcastStudio'],
    thumbnailConcepts: [
      `High-contrast split image featuring Aryan & Ananya with neon purple text: "${topic.substring(0, 20)}!"`,
      `Shocked host avatar expression with bold yellow text: "MUST WATCH: ${topic.substring(0, 15)}"`,
      `Futuristic AI radio studio background with large cyan question mark and title logo`,
    ],
    shortsMoments: [
      `00:30 - "Shocking truth about ${topic}!"`,
      `02:15 - "Why this changes everything you thought you knew."`,
      `04:10 - "Aryan & Ananya's quick 30-second summary."`,
    ],
    pinnedComment: `What are your thoughts on ${topic}? Share your opinion in the comments below! 👇 Don't forget to like & subscribe to RadioVerse AI for daily episodes! 🎙️✨`,
  };
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
