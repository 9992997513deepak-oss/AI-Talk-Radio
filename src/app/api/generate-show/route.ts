import { NextRequest, NextResponse } from 'next/server';
import { generateRadioScript } from '@/lib/gemini-script';
import { generateBatchDialogueTTS, generateTTSSpeech } from '@/lib/gemini-tts';
import { generateBackgroundMusic, generateCoverArt, generateYouTubeMetadata } from '@/lib/gemini-media';
import { mixFullShowAudio } from '@/lib/audio-mixer';
import { GenerateShowRequest, ShowResponse } from '@/types/radio';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing in environment variables.');
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing in environment variables', status: 'failed' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = (await req.json()) as GenerateShowRequest;

    const topic = body.topic?.trim() || 'The Future of AI and Daily Life';
    const title = body.title?.trim() || topic;
    const duration = body.duration || 3;
    const language = body.language || 'Hindi';
    const format = body.format || 'Real FM Radio Talk Show';
    const tone = body.tone || 'INFORMATIVE';
    const instructions = body.instructions;
    const targetAudience = body.targetAudience;
    const hosts = body.hosts;

    const requestPayload: GenerateShowRequest = {
      title,
      topic,
      duration,
      language,
      format,
      tone,
      instructions,
      targetAudience,
      hosts,
    };

    // 1. Generate Script
    const { script, dialogue, wordCount } = await generateRadioScript(requestPayload);

    // 2. Synthesize line-by-line speech audio
    const updatedDialogue = await generateBatchDialogueTTS(dialogue, language);

    // 3. Synthesize full voice stream
    const voiceBuffer = await generateTTSSpeech(updatedDialogue, language);

    // 4. Generate background music
    const musicBuffer = await generateBackgroundMusic(topic, tone);

    // 5. Mix voice & background music with auto-ducking
    const finalAudioBuffer = await mixFullShowAudio(updatedDialogue, voiceBuffer, musicBuffer, 0.15, 1.0);
    const base64Audio = finalAudioBuffer.toString('base64');
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

    // 6. Generate Cover Art
    const coverImageUrl = await generateCoverArt(topic);

    // 7. Generate YouTube Metadata
    const youtubeMetadata = generateYouTubeMetadata(topic, language);

    const defaultMaleHost = hosts?.maleHost || {
      name: 'Aryan',
      voice: 'hi-IN-MadhurNeural',
      personality: 'friendly, confident, witty, conversational, energetic',
      speed: 1.0,
      pitch: 0,
      role: 'Main Presenter',
      gender: 'male',
    };

    const defaultFemaleHost = hosts?.femaleHost || {
      name: 'Ananya',
      voice: 'hi-IN-SwaraNeural',
      personality: 'warm, expressive, intelligent, naturally curious, engaging',
      speed: 1.0,
      pitch: 0,
      role: 'Co-Host / Presenter',
      gender: 'female',
    };

    const responseData: ShowResponse = {
      id: `show_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      topic,
      instructions,
      targetAudience,
      duration,
      language,
      format,
      tone,
      hosts: { maleHost: defaultMaleHost, femaleHost: defaultFemaleHost },
      wordCount,
      estimatedDurationSec: duration * 60,
      actualDurationSec: Math.max(15, Math.ceil(wordCount / 2.5)),
      script,
      dialogue: updatedDialogue,
      audioUrl,
      coverImageUrl,
      status: 'completed',
      youtubeMetadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in /api/generate-show:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate show';
    return NextResponse.json(
      { error: message, status: 'failed' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
