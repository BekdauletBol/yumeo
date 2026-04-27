import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { getAnthropicKey } from '@/lib/security/apiKeyGuard';

export const runtime = 'nodejs';

interface AgentRequest {
  messages: Anthropic.MessageParam[];
  systemPrompt: string;
  projectId: string;
  userQuery: string;
  model?: 'claude-opus-4-5' | 'claude-sonnet-4-5';
}

import { retrieveRelevantChunks } from '@/lib/agent/rag';

/**
 * POST /api/agent
 *
 * Streams an AI response grounded in the researcher's uploaded materials.
 * Protected by Clerk auth and per-user rate limiting.
 */
export async function POST(req: Request): Promise<Response> {
  // ── Auth ────────────────────────────────────────────────────────────────
  const { userId } = auth();
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── Rate limit ──────────────────────────────────────────────────────────
  const limit = checkRateLimit(`agent:${userId}`, 20, 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  // ── Parse request ───────────────────────────────────────────────────────
  let body: AgentRequest;
  try {
    body = (await req.json()) as AgentRequest;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { messages, systemPrompt, projectId, userQuery, model = 'claude-sonnet-4-5' } = body;

  if (!systemPrompt || !messages || messages.length === 0 || !projectId || !userQuery) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields', code: 'BAD_REQUEST' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── RAG Retrieval ────────────────────────────────────────────────────────
  let finalSystemPrompt = systemPrompt;
  try {
    const chunks = await retrieveRelevantChunks(projectId, userQuery, 5);
    if (chunks && chunks.length > 0) {
      const chunkContext = chunks.map((c: any) => `[REF FROM VECTOR SEARCH]\n${c.content}`).join('\n\n');
      finalSystemPrompt += `\n\nADDITIONAL RELEVANT EXCERPTS FROM KNOWLEDGE BASE:\n${chunkContext}`;
    }
  } catch (err) {
    console.error('RAG Retrieval failed:', err);
  }

  // ── Stream ──────────────────────────────────────────────────────────────
  try {
    const apiKey = await getAnthropicKey(userId);
    const client = new Anthropic({ apiKey });

    const stream = client.messages.stream({
      model,
      max_tokens: 4096,
      system: finalSystemPrompt,
      messages,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-RateLimit-Remaining': String(limit.remaining),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message, code: 'AI_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}