import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { retrieveRelevantChunks } from '@/lib/agent/rag';
import { validateReport } from '@/lib/agent/reportValidation';
import { createServiceClient } from '@/lib/db/supabase';
import type { ReportAuditEntry, ReportGenerationResponse } from '@/lib/types';

export const runtime = 'nodejs';

interface GenerateRequest {
  templateBody: string;
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
  };
};

type ChunkRow = {
  id: string;
  content: string;
  metadata?: {
    author?: string;
    authors?: string[];
    year?: number;
    doi?: string;
    file_name?: string;
  } | null;
};

/**
 * POST /api/generate
 *
 * Fill a researcher's template with AI-generated content, grounded
 * in uploaded materials. Streams the result.
 */
export async function POST(req: Request): Promise<Response> {
  const { userId } = auth();
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const limit = checkRateLimit(`generate:${userId}`, 10, 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON', code: 'BAD_REQUEST' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { templateBody, projectId, userQuery } = body;

  try {
    // If no chunks in RAG, fall through — system prompt already has full PDF content
    const chunks = (await retrieveRelevantChunks(projectId, userQuery, 8).catch(() => [])) as RetrievedChunk[];

    const githubToken = process.env.GITHUB_MODELS_TOKEN ?? process.env.GITHUB_TOKEN;
    if (!githubToken) throw new Error('GitHub token not configured. Add GITHUB_MODELS_TOKEN or GITHUB_TOKEN to Vercel environment variables.');

    const client = new OpenAI({
      apiKey: githubToken,
      baseURL: 'https://models.inference.ai.azure.com',
    });

    const context = chunks
      .map((chunk) => {
        const fileName = chunk.metadata?.file_name ?? 'Unknown file';
        const page = chunk.metadata?.page ? `Page ${chunk.metadata.page}` : 'Page ?';
        return [
          `CHUNK ${chunk.id}`,
          `File: ${fileName}`,
          `Page: ${page}`,
          chunk.content,
        ].join('\n');
      })
      .join('\n\n');

    const pass1System = `You are Yumeo, a strict research assistant. You must only use the provided chunks.\n\nRULES:\n- Fill the template with grounded text only.\n- Every factual sentence must include [REF:chunk_id].\n- If content is missing, insert [SECTION_GAP].\n- Return JSON only, with keys: sections (array of {title, content}) and cited_chunk_ids (array).\n- Do not add references or bibliography.\n- Do not include any prose outside JSON.`;

    const pass1User = `TEMPLATE:\n${templateBody}\n\nCHUNKS:\n${context}`;

    const pass1 = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: pass1System },
        { role: 'user', content: pass1User },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    });

    const pass1Text = pass1.choices[0]?.message?.content ?? '{}';
    const pass1Json = safeParseJson<{ sections: Array<{ title: string; content: string }>; cited_chunk_ids: string[] }>(pass1Text);
    if (!pass1Json || !Array.isArray(pass1Json.sections)) {
      throw new Error('Pass 1 returned invalid JSON');
    }

    const draftRaw = pass1Json.sections
      .map((section) => `## ${section.title}\n${section.content}`)
      .join('\n\n');

    const pass2System = `You are an auditor. Validate every sentence against chunk evidence.\n\nReturn JSON only as an array of { sentence, refs, status } where status is SUPPORTED | OVERSTATED | WRONG_REF | HALLUCINATED.\nUse the same [REF:chunk_id] tags in refs. Do not include any prose outside JSON.`;
    const pass2User = `DRAFT:\n${draftRaw}\n\nCHUNKS:\n${context}`;

    const pass2 = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: pass2System },
        { role: 'user', content: pass2User },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    });

    const pass2Text = pass2.choices[0]?.message?.content ?? '[]';
    const audit = safeParseJson<ReportAuditEntry[]>(pass2Text) ?? [];

    const supabase = createServiceClient();
    const citedIds = pass1Json.cited_chunk_ids ?? [];
    const { data: chunkRows } = await supabase
      .from('chunks')
      .select('id, content, metadata')
      .in('id', citedIds)
      .eq('project_id', projectId);

    const typedChunkRows = (chunkRows ?? []) as ChunkRow[];
    const chunkRecords = typedChunkRows.map((chunk) => ({
      id: chunk.id,
      content: chunk.content,
      metadata: chunk.metadata ?? undefined,
    }));
    const validation = validateReport(draftRaw, audit, chunkRecords);

    const bibliography = typedChunkRows
      .map((chunk) => {
        const meta = chunk.metadata ?? {};
        const author = meta.author ?? (meta.authors?.[0] ?? 'Unknown author');
        const year = meta.year ? `(${meta.year})` : '';
        const doi = meta.doi ? ` DOI: ${meta.doi}` : '';
        const file = meta.file_name ?? 'Unknown file';
        return `${author} ${year} ${file}.${doi}`.trim();
      })
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);

    const response: ReportGenerationResponse = {
      draft: {
        sections: pass1Json.sections,
        citedChunkIds: citedIds,
        raw: draftRaw,
      },
      audit,
      validation,
      bibliography,
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message, code: 'AI_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

function safeParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}