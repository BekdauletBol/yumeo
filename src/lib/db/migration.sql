ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_section_check;
ALTER TABLE materials ADD CONSTRAINT materials_section_check CHECK (section in ('references','drafts','figures','tables','templates','equations','diagrams'));

-- ─── RAG hybrid search support ───────────────────────────────────────────

ALTER TABLE chunks
	ADD COLUMN IF NOT EXISTS search_tsvector tsvector
	GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX IF NOT EXISTS idx_chunks_search ON chunks USING gin (search_tsvector);

CREATE OR REPLACE FUNCTION match_chunks_hybrid (
	query_embedding vector(1536),
	query_text text,
	match_threshold float,
	match_count int,
	p_project_id uuid
)
RETURNS TABLE (
	id uuid,
	material_id uuid,
	content text,
	metadata jsonb,
	similarity float,
	text_rank float
)
LANGUAGE plpgsql
AS $$
BEGIN
	RETURN QUERY
	SELECT
		chunks.id,
		chunks.material_id,
		chunks.content,
		chunks.metadata,
		1 - (chunks.embedding <=> query_embedding) AS similarity,
		ts_rank(chunks.search_tsvector, websearch_to_tsquery('english', query_text)) AS text_rank
	FROM chunks
	WHERE chunks.project_id = p_project_id
		AND 1 - (chunks.embedding <=> query_embedding) >= match_threshold
	ORDER BY (0.7 * (1 - (chunks.embedding <=> query_embedding)) + 0.3 * ts_rank(chunks.search_tsvector, websearch_to_tsquery('english', query_text))) DESC
	LIMIT match_count;
END;
$$;
