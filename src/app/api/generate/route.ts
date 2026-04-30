// import { auth } from '@clerk/nextjs/server';
// import Anthropic from '@anthropic-ai/sdk';
// import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
// import { getAnthropicKey } from '@/lib/security/apiKeyGuard';

// export const runtime = 'nodejs';

// interface GenerateRequest {
//   templateBody: string;
//   systemPrompt: string;
//   model?: 'claude-3-5-sonnet-latest' | 'claude-3-5-haiku-latest' | 'claude-3-opus-latest';
// }

// /**
//  * POST /api/generate
//  *
//  * Fill a researcher's template with AI-generated content, grounded
//  * in uploaded materials. Streams the result.
//  */
// export async function POST(req: Request): Promise<Response> {
//   const { userId } = auth();
//   if (!userId) {
//     return new Response(
//       JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
//       { status: 401, headers: { 'Content-Type': 'application/json' } },
//     );
//   }

//   const limit = checkRateLimit(`generate:${userId}`, 10, 60_000);
//   if (!limit.allowed) return rateLimitResponse(limit.resetAt);

//   let body: GenerateRequest;
//   try {
//     body = (await req.json()) as GenerateRequest;
//   } catch {
//     return new Response(
//       JSON.stringify({ error: 'Invalid JSON', code: 'BAD_REQUEST' }),
//       { status: 400, headers: { 'Content-Type': 'application/json' } },
//     );
//   }

//   const { templateBody, systemPrompt, model = 'claude-3-5-sonnet-latest' } = body;

//   const userMessage = `Fill in the following research template using ONLY the provided materials.
// Replace each {{ placeholder }} with relevant content from the materials.
// Cite all sources using [REF:n] format.

// TEMPLATE:
// ${templateBody}`;

//   try {
//     const apiKey = await getAnthropicKey(userId);
//     const client = new Anthropic({ apiKey });

//     const stream = client.messages.stream({
//       model,
//       max_tokens: 8192,
//       system: systemPrompt,
//       messages: [{ role: 'user', content: userMessage }],
//     });

//     const readableStream = new ReadableStream({
//       async start(controller) {
//         try {
//           for await (const chunk of stream) {
//             if (
//               chunk.type === 'content_block_delta' &&
//               chunk.delta.type === 'text_delta'
//             ) {
//               controller.enqueue(new TextEncoder().encode(chunk.delta.text));
//             }
//           }
//           controller.close();
//         } catch (err) {
//           controller.error(err);
//         }
//       },
//     });

//     return new Response(readableStream, {
//       headers: { 'Content-Type': 'text/plain; charset=utf-8' },
//     });
//   } catch (err) {
//     const message = err instanceof Error ? err.message : 'Unknown error';
//     return new Response(
//       JSON.stringify({ error: message, code: 'AI_ERROR' }),
//       { status: 500, headers: { 'Content-Type': 'application/json' } },
//     );
//   }
// }

import { auth } from '@clerk/nextjs/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export const runtime = 'nodejs';

interface GenerateRequest {
  templateBody: string;
  systemPrompt: string;
  model?: string;
}

export async function POST(req: Request): Promise<Response> {
  const { userId } = auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const limit = checkRateLimit(`generate:${userId}`, 10, 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON', code: 'BAD_REQUEST' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { templateBody, systemPrompt, model = 'gpt-4o' } = body;
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN not set', code: 'CONFIG_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userMessage = `Fill in the following research template using ONLY the provided materials.
Replace each {{ placeholder }} with relevant content from the materials.
Cite all sources using [REF:n] format.

TEMPLATE:
${templateBody}`;

  try {
    const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        max_tokens: 8192,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err, code: 'AI_ERROR' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
            for (const line of lines) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data) as {
                  choices: { delta: { content?: string } }[];
                };
                const text = parsed.choices[0]?.delta?.content ?? '';
                if (text) controller.enqueue(new TextEncoder().encode(text));
              } catch { /* skip */ }
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, code: 'AI_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}