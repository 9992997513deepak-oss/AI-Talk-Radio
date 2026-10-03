import { NextRequest } from 'next/server'
import { generateRadioScript } from '@/lib/radio-script'
import { generateTTSSpeech } from '@/lib/radio-tts'
import { generateBackgroundMusic, mixVoiceAndMusic, generateCoverArt } from '@/lib/radio-media'
import { GenerateShowRequest, ShowResponse } from '@/types/radio'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<GenerateShowRequest>

    const topic = body.topic?.trim() || 'The Future of AI and Daily Life'
    const duration = body.duration || 3
    const language = body.language || 'Hindi'
    const tone = body.tone || 'INFORMATIVE'

    const requestPayload: GenerateShowRequest = {
      topic,
      duration,
      language,
      tone,
    }

    // Step A & B: Script generation
    const { script, dialogue, wordCount } = await generateRadioScript(requestPayload)

    // Step C: Speech audio generation via Edge TTS
    const voiceBuffer = await generateTTSSpeech(dialogue, language)

    // Step D: Background music generation
    const musicBuffer = await generateBackgroundMusic(topic, tone)

    // Step E: Voice + Background music mixing
    const finalAudioBuffer = await mixVoiceAndMusic(voiceBuffer, musicBuffer)
    const base64Audio = finalAudioBuffer.toString('base64')
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`

    // Step F: Cover Art Generation
    const coverImageUrl = await generateCoverArt(topic)

    const responseData: ShowResponse = {
      id: `show_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      topic,
      duration,
      language,
      tone,
      wordCount,
      script,
      dialogue,
      audioUrl,
      coverImageUrl,
      createdAt: new Date().toISOString(),
    }

    return Response.json(responseData)
  } catch (error: unknown) {
    console.error('Error generating radio show:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate radio show'
    return Response.json(
      { error: message },
      { status: 500 }
    )
  }
}
