import { NextResponse } from 'next/server';

const DID_API_URL = 'https://api.d-id.com';

export async function POST() {
  try {
    const response = await fetch(`${DID_API_URL}/talks/streams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.DID_API_KEY}`,
      },
      body: JSON.stringify({
        source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg',
        stream_warmup: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('D-ID stream creation error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create D-ID stream' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      streamId: data.id,
      sessionId: data.session_id,
      offer: data.offer,
      iceServers: data.ice_servers,
    });
  } catch (error) {
    console.error('D-ID stream error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
