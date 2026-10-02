import { NextRequest, NextResponse } from 'next/server'
import { generateRadioScript } from '@/lib/gemini-script'
import { generateTTSSpeech } from '@/lib/gemini-tts'
import { generateCoverArt } from '@/lib/gemini-media'
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

    // Step A: Script generation using Gemini 3.0 Flash
    console.log('[API Debug] Step A: Generating radio script...')
    const { script, dialogue, wordCount } = await generateRadioScript(requestPayload)
    console.log(`[API Debug] Script generated successfully. Dialogue lines: ${dialogue.length}, total words: ${wordCount}`)

    // Step B: Speech audio generation via Gemini TTS
    console.log('[API Debug] Step B: Generating speech audio via Gemini TTS API...')
    const ttsResult = await generateTTSSpeech(dialogue, language)
    const voiceBuffer = ttsResult.buffer
    const mimeType = ttsResult.mimeType || 'audio/wav'
    console.log(`[API Debug] TTS speech generated successfully. Buffer size: ${voiceBuffer.length} bytes, mimeType: ${mimeType}`)

    // Directly encode clean speech audio without background mixing
    const base64Audio = voiceBuffer.toString('base64')
    const audioUrl = `data:${mimeType};base64,${base64Audio}`

    // Step C: Cover Art Generation ("radio show cover art for [topic]")
    console.log('[API Debug] Step C: Generating cover art...')
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

    console.log('[API Debug] Show generation complete. ID:', responseData.id)
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
