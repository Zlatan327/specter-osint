import { NextResponse } from 'next/server';

const DID_API_URL = 'https://api.d-id.com';

export async function POST(request) {
  try {
    const { streamId, sessionId, text } = await request.json();

    const response = await fetch(
      `${DID_API_URL}/talks/streams/${streamId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${process.env.DID_API_KEY}`,
          'x-api-key-external': JSON.stringify({
            elevenlabs: process.env.ELEVENLABS_API_KEY,
          }),
        },
        body: JSON.stringify({
          session_id: sessionId,
          script: {
            type: 'text',
            input: text,
            provider: {
              type: 'elevenlabs',
              voice_id: 'pNInz6obpgDQGcFmaJgB',
              voice_config: {
                stability: 0.4,
                similarity_boost: 0.8,
                model_id: 'eleven_multilingual_v2',
              },
            },
            ssml: false,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('D-ID talk error:', errorText);
      return NextResponse.json(
        { error: 'Talk request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Talk error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
