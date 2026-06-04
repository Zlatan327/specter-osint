import { NextResponse } from 'next/server';

const DID_API_URL = 'https://api.d-id.com';

export async function POST(request) {
  try {
    const { streamId, sessionId, answer } = await request.json();

    const response = await fetch(
      `${DID_API_URL}/talks/streams/${streamId}/sdp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${process.env.DID_API_KEY}`,
        },
        body: JSON.stringify({
          answer,
          session_id: sessionId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('D-ID SDP error:', errorText);
      return NextResponse.json(
        { error: 'SDP exchange failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('SDP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
