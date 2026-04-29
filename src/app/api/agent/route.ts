import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { retrieveRelevantChunks } from '@/lib/agent/rag';
import { BLOCKED_TOPICS } from '@/lib/agent/buildSystemPrompt';
import { getAnthropicKey } from '@/lib/security/apiKeyGuard';

export const runtime = 'nodejs';

type ModelId = 'claude-3-5-sonnet-latest' | 'claude-3-5-haiku-latest' | 'claude-3-opus-latest';

interface AgentRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemPrompt: string;
  projectId: string;
  userQuery: string;
  model?: string;
}

/**
 * POST /api/agent
 * Streams a grounded AI response via direct Anthropic Claude API.
 */
export async function POST(req: Request): Promise<Response> {
  const { userId } = auth();
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const limit = checkRateLimit(`agent:${userId}`, 30, 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let body: AgentRequest;
  try {
    body = (await req.json()) as AgentRequest;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { messages, systemPrompt, projectId, userQuery, model = 'claude-3-5-sonnet-latest' } = body;

  if (!systemPrompt || !messages || messages.length === 0 || !projectId || !userQuery) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields', code: 'BAD_REQUEST' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Safety pre-screen
  const queryLower = userQuery.toLowerCase();
  const isBlocked = BLOCKED_TOPICS.some((topic) => queryLower.includes(topic));
  if (isBlocked) {
    const safeRefusal = 'This request falls outside the scope of a research assistant. I cannot help with this.';
    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({ start(c) { c.enqueue(encoder.encode(safeRefusal)); c.close(); } }),
      { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Blocked': 'true' } },
    );
  }

  // RAG retrieval
  let finalSystemPrompt = systemPrompt;
  try {
    const chunks = await retrieveRelevantChunks(projectId, userQuery, 5);
    if (chunks && chunks.length > 0) {
      const context = chunks
        .map((c: { content: string }) => `[REFERENCE EXCERPT]\n${c.content}`)
        .join('\n\n');
      finalSystemPrompt += `\n\nADDITIONAL RELEVANT EXCERPTS FROM KNOWLEDGE BASE:\n${context}`;
    }
  } catch (err) {
    console.warn('RAG retrieval skipped:', err instanceof Error ? err.message : err);
  }

  try {
    const apiKey = await getAnthropicKey(userId);
    const client = new Anthropic({ apiKey });
    
    // Map old model names to new Claude models if necessary
    let selectedModel = model;
    if (model.includes('gpt') || model.includes('openai')) {
      selectedModel = 'claude-3-5-sonnet-latest';
    } else if (model.includes('sonnet')) {
      selectedModel = 'claude-3-5-sonnet-latest';
    } else if (model.includes('opus')) {
      selectedModel = 'claude-3-opus-latest';
    }

    console.log('[agent] Starting stream for user:', userId);

    const stream = await client.messages.create({
      model: selectedModel,
      max_tokens: 4096,
      system: finalSystemPrompt,
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      stream: true,
    });

    const outStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          console.error('[agent] Stream processing error:', err);
          controller.error(err);
        }
      },
    });

    return new Response(outStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no', // Disable buffering for Nginx/Vercel
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Claude API error';
    console.error('[agent] Fatal error:', err);
    return new Response(
      JSON.stringify({ error: message, code: 'AI_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}