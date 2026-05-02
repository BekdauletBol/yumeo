import { createServiceClient } from '@/lib/db/supabase';
import type { Material } from '@/lib/types';

// Initialize GitHub Models client for embeddings using fetch
const getEmbeddingClient = () => {
  const githubToken = process.env.GITHUB_MODELS_TOKEN;
  if (!githubToken) {
    console.warn('[RAG] ⚠️ GITHUB_MODELS_TOKEN not set - embeddings will be random');
    return null;
  }
  return githubToken;
};

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
  const token = getEmbeddingClient();
  
  if (token) {
    try {
      console.log('[RAG] 🔑 Using GitHub Models for embedding');
      const response = await fetch('https://models.inference.ai.azure.com/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub Models API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as { data?: Array<{ embedding?: number[] }> };
      const embedding = data.data?.[0]?.embedding;
      
      if (!embedding) throw new Error('No embedding returned from GitHub Models');
      console.log('[RAG] ✅ Generated embedding: 1536 dims');
      return embedding;
    } catch (err) {
      console.error('[RAG] ❌ Failed to generate embedding via GitHub Models:', err instanceof Error ? err.message : err);
      throw err;
    }
  } else {
    // Dummy embedding for local testing if no API key
    console.warn('[RAG] ⚠️  GITHUB_MODELS_TOKEN not set - using dummy random embeddings (RAG will not work)');
    return Array.from({ length: 1536 }, () => Math.random() - 0.5);
  }
}

export async function chunkAndEmbedMaterial(material: Material) {
  if (!material.content || material.content.trim() === '') {
    console.warn(`[materials] ⚠️  Skipping embedding for empty material: ${material.name}`);
    return;
  }

  try {
    console.log(`[materials] 📄 Processing material for embedding: ${material.name} (${material.id})`);
    console.log(`[materials] GITHUB_MODELS_TOKEN available: ${!!process.env.GITHUB_MODELS_TOKEN}`);
    
    const paragraphs = collectParagraphs(material.content, material.metadata.pageText);
    const chunks = buildChunks(paragraphs);
    
    console.log(`[materials] ✂️  Split into ${chunks.length} chunks`);
    
    const supabase = createServiceClient();

    let successCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk?.content || chunk.content.trim().length < 10) continue;

      try {
        const embedding = await generateEmbedding(chunk.content);
        console.log(`[materials] 🔐 Embedding chunk ${i+1}/${chunks.length}: ${embedding.length} dims`);

        const { error: insertError } = await supabase.from('chunks').insert({
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

        if (insertError) {
          console.error(`[materials] ❌ Failed to insert chunk ${i}: ${insertError.message}`);
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`[materials] ❌ Error embedding chunk ${i}:`, err instanceof Error ? err.message : err);
      }
    }
    
    console.log(`[materials] ✅ Successfully embedded ${successCount}/${chunks.length} chunks for: ${material.name}`);
  } catch (err) {
    console.error(`[materials] ❌ Failed to process material ${material.name}:`, err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function retrieveRelevantChunks(projectId: string, query: string, topK: number = 8) {
  try {
    console.log('[RAG] 🔍 retrieveRelevantChunks called:', { projectId, query: query.substring(0, 50), topK });
    
    if (!process.env.GITHUB_MODELS_TOKEN) {
      console.warn('[RAG] ⚠️ GITHUB_MODELS_TOKEN not configured - embeddings will be random (RAG disabled)');
    }

    const embedding = await generateEmbedding(query);
    console.log('[RAG] ✅ Generated embedding, length:', embedding.length);
    
    const supabase = createServiceClient();

    // Hybrid search: vector similarity + full-text rank
    console.log('[RAG] 🔎 Calling match_chunks_hybrid RPC...');
    const { data, error } = await supabase.rpc('match_chunks_hybrid', {
      query_embedding: embedding,
      query_text: query,
      match_threshold: 0.7,
      match_count: topK,
      p_project_id: projectId
    });
    
    if (error) {
      console.error('[RAG] ❌ RPC error retrieving chunks:', error.message, error.code);
      return [];
    }

    console.log('[RAG] 📊 RPC returned:', { 
      dataLength: data?.length || 0,
      projectId,
    });

    if (!data || data.length === 0) {
      console.warn('[RAG] ⚠️ No chunks found for query:', query.substring(0, 50), 'Project:', projectId);
      // Debug: Let's check if chunks table has ANY data
      const { data: allChunks, error: countErr } = await supabase
        .from('chunks')
        .select('id, project_id', { count: 'exact' })
        .eq('project_id', projectId);
      console.log('[RAG] 📋 Chunks in DB for this project:', allChunks?.length || 0, 'Error:', countErr?.message ?? 'none');
    } else {
      console.log(`[RAG] ✅ Retrieved ${data.length} chunks for query:`, query.substring(0, 50));
    }
    
    return data || [];
  } catch (err) {
    console.error('[RAG] ❌ Error retrieving chunks:', err instanceof Error ? err.message : err);
    return [];
  }
}
