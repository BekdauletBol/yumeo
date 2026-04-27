import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicKey } from '@/lib/security/apiKeyGuard';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export const runtime = 'nodejs';

interface VisionRequest {
  imageBase64: string;
  mediaType: string;
  context?: string;
  filename?: string;
}

export async function POST(req: Request): Promise<Response> {
  const { userId } = auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const limit = checkRateLimit(`vision:${userId}`, 15, 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let body: VisionRequest;
  try {
    body = (await req.json()) as VisionRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON', code: 'BAD_REQUEST' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { imageBase64, mediaType, context = '', filename = 'image' } = body;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(mediaType)) {
    return new Response(JSON.stringify({ error: 'Unsupported image type', code: 'BAD_REQUEST' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const apiKey = await getAnthropicKey(userId);
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Analyze this research image (filename: ${filename}).
${context ? `Context: ${context}` : ''}

Please provide:
1. A detailed description of what the image shows
2. Any text, numbers, labels, or data visible in the image (extracted verbatim)
3. A concise suggested caption (1–2 sentences) suitable for an academic paper

Respond in JSON with keys: description, extractedText, suggestedCaption`,
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const raw = textBlock && 'text' in textBlock ? textBlock.text : '{}';

    let parsed: { description?: string; extractedText?: string; suggestedCaption?: string };
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as typeof parsed;
    } catch {
      parsed = { description: raw, extractedText: '', suggestedCaption: '' };
    }

    return new Response(
      JSON.stringify({
        description: parsed.description ?? '',
        extractedText: parsed.extractedText ?? '',
        suggestedCaption: parsed.suggestedCaption ?? '',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Vision analysis failed';
    return new Response(JSON.stringify({ error: message, code: 'AI_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}