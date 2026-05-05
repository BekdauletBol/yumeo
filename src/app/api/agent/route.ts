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

type RetrievedChunk = {
  id: string;
  content: string;
  metadata?: {
    file_name?: string;
    page?: number;
    page_end?: number;
  };
};

/**
 * POST /api/agent
 * Streams a grounded AI response via GitHub Models (GPT-4o).
 */
export async function POST(req: Request): Promise<Response> {
  // eslint-disable-next-line no-console
  console.log('[agent] 🚀 POST /api/agent received request');

  const { userId } = auth();
  // eslint-disable-next-line no-console
  console.log('[agent] Auth userId:', userId ? '✓ authenticated' : '✗ not authenticated');
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
    // eslint-disable-next-line no-console
    console.log('[agent] Request body parsed:', {
      messagesCount: body.messages?.length,
      projectId: body.projectId,
      userQuery: body.userQuery?.substring(0, 50),
      model: body.model,
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { messages, systemPrompt, projectId, userQuery, model = process.env.GITHUB_MODELS_MODEL || 'openai/gpt-4o' } = body;

  if (!systemPrompt || !messages || messages.length === 0 || !projectId || !userQuery) {
    // eslint-disable-next-line no-console
    console.warn('[agent] ⚠️ Missing required fields:', {
      hasSystemPrompt: !!systemPrompt,
      hasMessages: !!messages,
      messagesLen: messages?.length,
      hasProjectId: !!projectId,
      hasUserQuery: !!userQuery,
    });
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

  // RAG retrieval (optional context enrichment)
  let finalSystemPrompt = systemPrompt;
  let retrievedChunks: RetrievedChunk[] = [];
  try {
    // eslint-disable-next-line no-console
    console.log('[agent] 🔍 Starting RAG retrieval for query:', userQuery.substring(0, 50));
    const chunks = (await retrieveRelevantChunks(projectId, userQuery, 8)) as RetrievedChunk[];
    // eslint-disable-next-line no-console
    console.log('[agent] RAG result:', {
      chunksRetrieved: chunks?.length || 0,
      projectId,
      chunkIds: chunks?.slice(0, 3).map(c => c.id),
    });
    if (chunks && chunks.length > 0) {
      retrievedChunks = chunks;
      const context = chunks
        .map((c) => `[REFERENCE EXCERPT]\n${c.content}`)
        .join('\n\n');
      finalSystemPrompt += `\n\nADDITIONAL RELEVANT EXCERPTS FROM KNOWLEDGE BASE:\n${context}`;
      // eslint-disable-next-line no-console
      console.log(`[agent] ✅ RAG enriched prompt with ${chunks.length} chunks`);
    } else {
      // eslint-disable-next-line no-console
      console.log('[agent] ℹ️  No relevant chunks found - proceeding with base knowledge');
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[agent] ⚠️ RAG retrieval failed:', err instanceof Error ? err.message : err);
    // eslint-disable-next-line no-console
    console.warn('[agent] Possible causes: no GITHUB_MODELS_TOKEN, chunks table missing, or materials not embedded');
  }

  // Continue with LLM call even if no chunks (use base knowledge)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _sourcesLine = buildSourcesLine(retrievedChunks);

  try {
    const githubToken = process.env.GITHUB_MODELS_TOKEN ?? process.env.GITHUB_TOKEN;
    // eslint-disable-next-line no-console
    console.log('[agent] Checking GitHub Models env vars:', {
      hasToken: !!githubToken,
      tokenLength: githubToken?.length || 0,
      model,
    });
    if (!githubToken) throw new Error('GitHub token not configured. Add GITHUB_MODELS_TOKEN or GITHUB_TOKEN to Vercel environment variables.');

    const client = new OpenAI({
      apiKey: githubToken,
      baseURL: 'https://models.inference.ai.azure.com',
    });

    // Resolve model: strip 'openai/' prefix for Azure inference endpoint
    const resolvedModel = model.replace(/^openai\//, '');
    const isLargeModel = resolvedModel.includes('gpt-5') || resolvedModel.includes('claude');

    // Trim conversation history to avoid token overflows.
    // gpt-4o: keep last 6 turns (3 user + 3 assistant)
    // gpt-5 / claude: keep last 20 turns
    const historyLimit = isLargeModel ? 20 : 6;
    const trimmedMessages = messages.slice(-historyLimit);

    // eslint-disable-next-line no-console
    console.log('[agent] 🤖 Calling GitHub Models API:', { model: resolvedModel, historyLen: trimmedMessages.length });
    const stream = await client.chat.completions.create({
      model: resolvedModel,
      messages: [
        { role: 'system', content: finalSystemPrompt },
        ...trimmedMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      stream: true,
      max_tokens: isLargeModel ? 16_384 : 4_096,
      temperature: 0.7,
    });

    // eslint-disable-next-line no-console
    console.log('[agent] ✅ Stream opened successfully');

    const outStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          // ── Buffer the full response first ────────────────────────────────
          // We do this so we can strip trailing conversational noise BEFORE
          // it ever reaches the client.
          let fullText = '';
          for await (const chunk of stream) {
            fullText += chunk.choices[0]?.delta?.content || '';
          }

          // ── Strip conversational filler ────────────────────────────────────
          const cleaned = stripAIConversationalNoise(fullText);

          // eslint-disable-next-line no-console
          console.log(`[agent] ✅ Streaming complete: ${fullText.length} → ${cleaned.length} chars (removed ${fullText.length - cleaned.length} chars of filler)`);

          controller.enqueue(encoder.encode(cleaned));
          controller.close();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[agent] ❌ Stream processing error:', err);
          controller.error(err);
        }
      },
    });

    // eslint-disable-next-line no-console
    console.log('[agent] 📤 Returning readable stream response');
    return new Response(outStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GitHub Models error';
    // eslint-disable-next-line no-console
    console.error('[agent] ❌ Fatal error:', {
      message,
      error: err instanceof Error ? err.stack : err,
    });
    return new Response(
      JSON.stringify({ error: message, code: 'AI_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

// ─── Strip conversational AI noise from responses ────────────────────────────
const TRAILING_NOISE_PATTERNS = [
  // "Let me know if..." variations
  /^let me know\b.*/i,
  /^feel free to\b.*/i,
  /^please let me know\b.*/i,
  /^if you (need|want|have|require)\b.*/i,
  /^i hope this\b.*/i,
  /^hope this helps\b.*/i,
  /^this should\b.*/i,
  /^don't hesitate\b.*/i,
  /^should you\b.*/i,
  /^i('m| am) happy to\b.*/i,
  /^certainly[,!]?\s/i,
  /^of course[,!]?\s/i,
  /^sure[,!]?\s/i,
  /^here is\b.*/i,
  /^here are\b.*/i,
  /^below is\b.*/i,
  /^as requested\b.*/i,
  /^based on (the|your)\b.*/i,
  /^additional (adjustments|refinements|edits|changes)\b.*/i,
  /^(if|for) (further|any|additional)\b.*/i,
];

function stripAIConversationalNoise(text: string): string {
  // Split into lines, trim trailing blank lines first
  const lines = text.split('\n');

  // ── Strip trailing conversational lines ──────────────────────────────────
  // Walk from the bottom up, removing noise lines + trailing --- separators
  let end = lines.length;
  while (end > 0) {
    const line = (lines[end - 1] ?? '').trim();

    // Empty line — skip
    if (line === '') { end--; continue; }

    // Decorative separator at the very end — remove
    if (/^-{3,}$/.test(line)) { end--; continue; }

    // Conversational trailing phrase — remove
    const isNoise = TRAILING_NOISE_PATTERNS.some((p) => p.test(line));
    if (isNoise) { end--; continue; }

    // First non-noise line found — stop
    break;
  }

  // ── Strip leading conversational lines ───────────────────────────────────
  let start = 0;
  while (start < end) {
    const line = (lines[start] ?? '').trim();

    if (line === '') { start++; continue; }

    // Decorative separator at the very top — remove
    if (/^-{3,}$/.test(line)) { start++; continue; }

    const isNoise = TRAILING_NOISE_PATTERNS.some((p) => p.test(line));
    if (isNoise) { start++; continue; }

    break;
  }

  return lines.slice(start, end).join('\n').trim();
}

// ─── Build sources list (kept for logging, no longer appended to response) ───
function buildSourcesLine(chunks: RetrievedChunk[]): string {
  const seen = new Set<string>();
  const items: string[] = [];

  for (const chunk of chunks) {
    const fileName = chunk.metadata?.file_name ?? 'Unknown file';
    const pageStart = chunk.metadata?.page;
    const pageEnd = chunk.metadata?.page_end;
    const pageLabel =
      pageStart && pageEnd && pageEnd !== pageStart
        ? `p.${pageStart}-${pageEnd}`
        : pageStart
          ? `p.${pageStart}`
          : 'p.?';
    const label = `${fileName}, ${pageLabel}`;
    if (seen.has(label)) continue;
    seen.add(label);
    items.push(label);
  }

  return `Sources: [${items.join('; ')}]`;
}