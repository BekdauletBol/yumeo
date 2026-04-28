import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { retrieveRelevantChunks } from '@/lib/agent/rag';
import { BLOCKED_TOPICS } from '@/lib/agent/buildSystemPrompt';

export const runtime = 'nodejs';

const GITHUB_ENDPOINT = 'https://models.github.ai/inference/chat/completions';
const DEFAULT_GITHUB_MODEL = 'openai/gpt-4o';

type ModelId =
  | 'openai/gpt-4o'
  | 'openai/gpt-4o-mini'
  | 'openai/gpt-5'
  | 'openai/o1-mini'
  | 'claude-opus-4-5'
  | 'claude-sonnet-4-5';

interface AgentRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemPrompt: string;
  projectId: string;
  userQuery: string;
  model?: ModelId;
}

interface GHMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function isClaudeModel(model: ModelId): boolean {
  return model.startsWith('claude-');
}

/**
 * POST /api/agent
 * Streams a grounded AI response via GitHub Models (plain fetch) or Anthropic Claude.
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

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: AgentRequest;
  try {
    body = (await req.json()) as AgentRequest;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { messages, systemPrompt, projectId, userQuery, model = DEFAULT_GITHUB_MODEL } = body;

  if (!systemPrompt || !messages || messages.length === 0 || !projectId || !userQuery) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields', code: 'BAD_REQUEST' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── Safety pre-screen ────────────────────────────────────────────────────
  // Block dangerous/harmful queries server-side before they reach the AI.
  const queryLower = userQuery.toLowerCase();
  const isBlocked = BLOCKED_TOPICS.some((topic) => queryLower.includes(topic));
  if (isBlocked) {
    const safeRefusal = 'This request falls outside the scope of a research assistant. I cannot help with this.';
    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({ start(c) { c.enqueue(encoder.encode(safeRefusal)); c.close(); } }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Blocked': 'true',
        },
      },
    );
  }

  // ── RAG retrieval (non-fatal) ────────────────────────────────────────────
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
    // RAG is optional — Supabase match_chunks may not be configured yet
    console.warn('RAG retrieval skipped (non-fatal):', err instanceof Error ? err.message : err);
  }

  // ── Route to provider ────────────────────────────────────────────────────
  try {
    if (isClaudeModel(model)) {
      return await streamClaude(
        model as 'claude-opus-4-5' | 'claude-sonnet-4-5',
        messages,
        finalSystemPrompt,
        limit.remaining,
      );
    }
    return await streamGitHubModels(model, messages, finalSystemPrompt, limit.remaining);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown AI error';
    console.error('[agent] Error:', message);
    return new Response(
      JSON.stringify({ error: message, code: 'AI_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GitHub Models — plain fetch, streaming SSE
// ─────────────────────────────────────────────────────────────────────────────

async function streamGitHubModels(
  model: ModelId,
  messages: AgentRequest['messages'],
  systemPrompt: string,
  rateLimitRemaining: number,
): Promise<Response> {
  const token = process.env['GITHUB_TOKEN'] ?? process.env['GITHUB_MODELS_TOKEN'];
  if (!token) {
    throw new Error('GITHUB_TOKEN is not set in .env.local');
  }

  const ghMessages: GHMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  // Call GitHub Models with streaming enabled
  const upstream = await fetch(GITHUB_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      messages: ghMessages,
      stream: true,
      max_tokens: 4096,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text();
    throw new Error(`GitHub Models ${upstream.status}: ${errText}`);
  }

  // Parse SSE stream from GitHub → re-stream plain text to client
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const outStream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const text = parsed.choices?.[0]?.delta?.content ?? '';
              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              // ignore malformed SSE lines
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(outStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Model': model,
      'X-RateLimit-Remaining': String(rateLimitRemaining),
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Anthropic Claude streaming (fallback)
// ─────────────────────────────────────────────────────────────────────────────

async function streamClaude(
  model: 'claude-opus-4-5' | 'claude-sonnet-4-5',
  messages: AgentRequest['messages'],
  systemPrompt: string,
  rateLimitRemaining: number,
): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in .env.local');

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const claudeStream = client.messages.stream({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  const outStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of claudeStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(outStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Model': model,
      'X-RateLimit-Remaining': String(rateLimitRemaining),
    },
  });
}