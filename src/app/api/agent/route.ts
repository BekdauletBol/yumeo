import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { retrieveRelevantChunks } from '@/lib/agent/rag';
import { BLOCKED_TOPICS } from '@/lib/agent/buildSystemPrompt';

export const runtime = 'nodejs';

interface AgentRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemPrompt: string;
  projectId: string;
  userQuery: string;
  model?: string;
}

/**
 * POST /api/agent
 * Streams a grounded AI response via GitHub Models (GPT-4o).
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

  const { messages, systemPrompt, projectId, userQuery, model = 'gpt-4o' } = body;

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
    const githubToken = process.env.GITHUB_MODELS_TOKEN;
    if (!githubToken) throw new Error('GITHUB_MODELS_TOKEN is not configured');

    const client = new OpenAI({
      apiKey: githubToken,
      baseURL: 'https://models.inference.ai.azure.com',
    });

    console.log('[agent] Starting GitHub Models stream for user:', userId, 'model:', model);

    const stream = await client.chat.completions.create({
      model: model.includes('gpt') ? model : 'gpt-4o',
      messages: [
        { role: 'system', content: finalSystemPrompt },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      stream: true,
      max_tokens: 4096,
      temperature: 0.7,
    });

    const outStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
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
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GitHub Models error';
    console.error('[agent] Fatal error:', err);
    return new Response(
      JSON.stringify({ error: message, code: 'AI_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}