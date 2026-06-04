import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { image, country, mode } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a sharp-eyed visual analyst. Analyze the image the user is showing via their webcam.

Detect what the user is showing:
1. **Outfit being worn** — Describe the clothing items, colors, patterns, fit, style, and overall aesthetic.
2. **Clothes laid out / held up** — Describe individual pieces, colors, materials, and how they might pair together.
3. **Food / Cooked meal** — Describe the dish, ingredients visible, presentation, plating, and cuisine type.
4. **Other** — Describe what you see.

The user is located in: ${country || 'Unknown country'}.
Consider current fashion trends and cultural norms for that region when relevant.

Provide your analysis as a JSON object with these fields:
- "category": one of "outfit_worn", "clothes_displayed", "food", "other"
- "description": A detailed 2-3 sentence factual description of what you see
- "items": An array of specific items/pieces identified
- "colors": Main colors detected
- "style_notes": Cultural or stylistic observations relevant to the user's country
- "suggestion_hooks": 2-3 specific things the AI critic could comment on (both positive and constructive)

Respond ONLY with the JSON object, no other text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`,
                  detail: 'low',
                },
              },
              {
                type: 'text',
                text: mode === 'food'
                  ? 'Analyze this meal/food.'
                  : 'Analyze this outfit or clothing.',
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Vision error:', errorText);
      return NextResponse.json(
        { error: 'Vision analysis failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content || '{}';

    let analysis;
    try {
      const cleanJson = analysisText.replace(/```json\n?|```\n?/g, '').trim();
      analysis = JSON.parse(cleanJson);
    } catch {
      analysis = {
        category: 'other',
        description: analysisText,
        items: [],
        colors: [],
        style_notes: '',
        suggestion_hooks: [],
      };
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Vision API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
