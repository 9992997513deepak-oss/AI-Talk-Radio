import { NextRequest, NextResponse } from 'next/server'
import { generateRadioScript } from '@/lib/gemini-script'
import { generateTTSSpeech } from '@/lib/gemini-tts'
import { generateBackgroundMusic, mixVoiceAndMusic, generateCoverArt } from '@/lib/gemini-media'
import { GenerateShowRequest, ShowResponse } from '@/types/radio'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<GenerateShowRequest>

    const topic = body.topic?.trim() || 'The Future of AI and Daily Life'
    const duration = body.duration || 3
    const language = body.language || 'Hindi'
    const tone = body.tone || 'INFORMATIVE'

    console.log('[API Debug] Generating show with params:', { topic, duration, language, tone })

    const requestPayload: GenerateShowRequest = {
      topic,
      duration,
      language,
      tone,
    }

    // Step A & B: Script generation using Gemini
    console.log('[API Debug] Step A: Generating script...')
    const { script, dialogue, wordCount } = await generateRadioScript(requestPayload)
    console.log(`[API Debug] Script generated. Lines count: ${dialogue.length}, total words: ${wordCount}`)

    // Step C: Speech audio generation via Gemini TTS
    console.log('[API Debug] Step B: Synthesizing TTS speech audio...')
    const ttsResult = await generateTTSSpeech(dialogue, language)
    const voiceBuffer = ttsResult.buffer
    let finalMimeType = ttsResult.mimeType || 'audio/wav'
    console.log(`[API Debug] TTS speech generated. Buffer size: ${voiceBuffer.length} bytes, mimeType: ${finalMimeType}`)

    let finalAudioBuffer = voiceBuffer

    // Step D & E: Lyria background music loop & mixing (with clean TTS audio fallback)
    try {
      console.log('[API Debug] Step C: Attempting background music generation...')
      const musicBuffer = await generateBackgroundMusic(topic, tone)
      console.log(`[API Debug] Background music generated. Buffer size: ${musicBuffer.length} bytes`)

      console.log('[API Debug] Step D: Mixing speech voice + music...')
      finalAudioBuffer = await mixVoiceAndMusic(voiceBuffer, musicBuffer)
      finalMimeType = 'audio/mp3'
      console.log(`[API Debug] Audio mix complete. Final buffer size: ${finalAudioBuffer.length} bytes`)
    } catch (musicErr) {
      console.warn('[API Warning] Background music generation/mixing failed. Proceeding with clean TTS audio:', musicErr)
      finalAudioBuffer = voiceBuffer
    }

    const base64Audio = finalAudioBuffer.toString('base64')
    const audioUrl = `data:${finalMimeType};base64,${base64Audio}`

    // Step F: Cover Art Generation ("radio show cover art for [topic]")
    console.log('[API Debug] Step E: Generating cover art...')
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

    console.log('[API Debug] Show generation successful. ID:', responseData.id)
    return NextResponse.json(responseData)
  } catch (error: unknown) {
    console.error('[API Error] Critical failure in generate-show route:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate radio show'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
