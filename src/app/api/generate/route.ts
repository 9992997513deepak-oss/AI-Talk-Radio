import { NextRequest, NextResponse } from 'next/server';
import { POST as generateShowPOST } from '@/app/api/generate-show/route';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing in environment variables.');
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing in environment variables', status: 'failed' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return await generateShowPOST(req);
  } catch (error: unknown) {
    console.error('Error in /api/generate route:', error);
    const message = error instanceof Error ? error.message : 'Generation route failed';
    return NextResponse.json(
      { error: message, status: 'failed' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
