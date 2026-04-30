import { createServiceClient } from '@/lib/db/supabase';
import OpenAI from 'openai';
import type { Material } from '@/lib/types';

// We use OpenAI for embeddings, or fallback to a dummy embedding if no key is present for MVP purposes
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

const CHUNK_MIN_TOKENS = 150;
const CHUNK_MAX_TOKENS = 400;
const CHUNK_OVERLAP_TOKENS = 50;

type Paragraph = { text: string; page: number };

function estimateTokens(text: string): number {
  return Math.ceil(text.trim().length / 4);
}

function splitLongParagraph(text: string, page: number): Paragraph[] {
  const maxChars = CHUNK_MAX_TOKENS * 4;
  if (text.length <= maxChars) return [{ text, page }];

  const parts: Paragraph[] = [];
  let start = 0;
  while (start < text.length) {
    const slice = text.slice(start, start + maxChars);
    parts.push({ text: slice.trim(), page });
    start += maxChars;
  }
  return parts;
}

function splitPageIntoParagraphs(pageText: string, page: number): Paragraph[] {
  const raw = pageText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!raw) return [];

  const blocks = raw.split(/\n{2,}/g).map((b) => b.trim()).filter(Boolean);
  const paragraphs = blocks.length > 0 ? blocks : [raw];

  return paragraphs.flatMap((p) => {
    if (estimateTokens(p) <= CHUNK_MAX_TOKENS) return [{ text: p, page }];
    return splitLongParagraph(p, page);
  });
}

function collectParagraphs(text: string, pages?: string[]): Paragraph[] {
  if (pages && pages.length > 0) {
    return pages.flatMap((pageText, index) => splitPageIntoParagraphs(pageText, index + 1));
  }

  return splitPageIntoParagraphs(text, 1);
}

function buildChunks(paragraphs: Paragraph[]): Array<{ content: string; pageStart: number; pageEnd: number }> {
  const chunks: Array<{ content: string; pageStart: number; pageEnd: number }> = [];
  let current: Paragraph[] = [];
  let currentTokens = 0;

  const flushChunk = () => {
    if (current.length === 0) return;
    const content = current.map((p) => p.text).join('\n\n').trim();
    const pageStart = current[0]?.page ?? 1;
    const pageEnd = current[current.length - 1]?.page ?? pageStart;
    if (content) {
      chunks.push({ content, pageStart, pageEnd });
    }
  };

  const takeOverlap = (): Paragraph[] => {
    let tokens = 0;
    const overlap: Paragraph[] = [];
    for (let i = current.length - 1; i >= 0; i -= 1) {
      const paragraph = current[i];
      if (!paragraph) continue;
      tokens += estimateTokens(paragraph.text);
      overlap.unshift(paragraph);
      if (tokens >= CHUNK_OVERLAP_TOKENS) break;
    }
    return overlap;
  };

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph.text);
    if (paragraphTokens === 0) continue;

    if (
      currentTokens + paragraphTokens > CHUNK_MAX_TOKENS &&
      currentTokens >= CHUNK_MIN_TOKENS
    ) {
      flushChunk();
      const overlap = takeOverlap();
      current = [...overlap];
      currentTokens = overlap.reduce((sum, p) => sum + estimateTokens(p.text), 0);
    }

    current.push(paragraph);
    currentTokens += paragraphTokens;
  }

  flushChunk();
  return chunks;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (process.env.OPENAI_API_KEY) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });
    const first = response.data[0];
    if (!first) throw new Error('No embedding returned');
    return first.embedding;
  } else {
    // Dummy embedding for local testing if no API key
    return Array.from({ length: 1536 }, () => Math.random() - 0.5);
  }
}

export async function chunkAndEmbedMaterial(material: Material) {
  if (!material.content || material.content.trim() === '') return;

  const paragraphs = collectParagraphs(material.content, material.metadata.pageText);
  const chunks = buildChunks(paragraphs);
  const supabase = createServiceClient();

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk?.content || chunk.content.trim().length < 10) continue;

    const embedding = await generateEmbedding(chunk.content);

    await supabase.from('chunks').insert({
      material_id: material.id,
      project_id: material.projectId,
      content: chunk.content,
      embedding,
      metadata: {
        chunkIndex: i,
        file_id: material.id,
        project_id: material.projectId,
        file_name: material.name,
        author: material.metadata.authors?.[0] ?? null,
        authors: material.metadata.authors ?? [],
        year: material.metadata.year ?? null,
        doi: material.metadata.doi ?? null,
        page: chunk.pageStart,
        page_end: chunk.pageEnd,
        section_title: null,
      },
    });
  }
}

export async function retrieveRelevantChunks(projectId: string, query: string, topK: number = 8) {
  const embedding = await generateEmbedding(query);
  const supabase = createServiceClient();

  // Hybrid search: vector similarity + full-text rank
  const { data, error } = await supabase.rpc('match_chunks_hybrid', {
    query_embedding: embedding,
    query_text: query,
    match_threshold: 0.7,
    match_count: topK,
    p_project_id: projectId
  });
  
  if (error) {
    console.error('Error retrieving chunks:', error);
    return [];
  }
  
  return data || [];
}
