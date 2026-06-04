import { NextResponse } from 'next/server';

const DID_API_URL = 'https://api.d-id.com';

export async function POST(request) {
  try {
    const { streamId, sessionId } = await request.json();

    const response = await fetch(
      `${DID_API_URL}/talks/streams/${streamId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${process.env.DID_API_KEY}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Destroy stream error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
