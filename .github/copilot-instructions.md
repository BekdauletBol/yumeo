# Copilot Instructions for Yumeo

This document helps AI assistants understand the codebase structure, conventions, and workflows for efficient development in the Yumeo Research IDE.

## Quick Commands

### Development & Testing
```bash
npm run dev              # Start dev server (port 3010)
npm run build            # Build Next.js app
npm start                # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run format           # Format with Prettier
npm run typecheck        # TypeScript validation
npm test                 # Run all Vitest tests
npm run test:ui          # Open Vitest UI dashboard
```

**Run a single test file:**
```bash
npx vitest src/lib/agent/rag.test.ts
```

## Project Architecture

### Overview
Yumeo is a **Research IDE** that combines document management with a RAG-powered AI assistant. The architecture splits cleanly into:
- **Frontend:** React components + Zustand state
- **Backend:** Next.js API routes + Server Actions
- **Database:** Supabase (PostgreSQL + pgvector)
- **AI:** OpenAI embeddings + GitHub Models (GPT-4o)

### RAG Pipeline (Core Feature)
The "grounded AI" relies on a four-stage pipeline:

1. **Material Upload** → User uploads PDFs/docs to project sections
2. **Chunking** → Content split into 150–400 token semantic chunks with 50-token overlap
3. **Embedding** → Each chunk vectorized via OpenAI's `text-embedding-3-small` (1536 dims)
4. **Retrieval** → User query triggers hybrid search (vector similarity + BM25 full-text)
5. **Generation** → Retrieved chunks added to system prompt; GitHub Models streams response

**Key constants** (src/lib/agent/rag.ts):
```typescript
CHUNK_MIN_TOKENS = 150
CHUNK_MAX_TOKENS = 400
CHUNK_OVERLAP_TOKENS = 50
```

### State Management (Zustand Stores)
- **chatStore** – Messages, streaming state
- **materialsStore** – Materials indexed by section
- **projectSectionsStore** – Dynamic sections (references, drafts, figures, etc.)
- **projectStore** – Active project + settings
- **uiStore** – Sidebar, theme, modal state

All stores in `src/stores/`. Use `useShallow()` hook for computed selectors to prevent unnecessary re-renders.

### Server Actions Pattern
All data mutations use Next.js server actions (`'use server'`) in `src/app/actions/`:
- **Ownership verification** is mandatory – always verify `userId` matches before operating
- Use `createServiceClient()` (service role) for database operations in actions
- Fire-and-forget async tasks (e.g., `chunkAndEmbedMaterial`) use `.catch()` to avoid throwing
- Example verification pattern:
  ```typescript
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();
  if (!project) throw new Error('Project not found or unauthorized');
  ```

### Material Sections
Each project has user-created sections (dynamic since v1.2):
```typescript
type MaterialSection = 'references' | 'drafts' | 'figures' | 'tables' | 'templates' | 'equations' | 'diagrams'
```

**Section priority** (for context ordering in system prompts):
1. references
2. drafts
3. figures
4. tables
5. templates

Sections are stored in the `project_sections` table; materials link to sections via `section_id` (nullable, backward-compatible with legacy `section` string).

### Database Queries
- Use `supabase.from().select()` in components (client)
- Use `createServiceClient()` in actions/routes (bypasses RLS)
- Hybrid search for RAG uses RPC function `match_chunks_hybrid` (vector + BM25)
- Always `select().single()` when expecting one row, `.select()` for multiple

## Key Conventions

### Types & Interfaces
Located in `src/lib/types/`:
- **Material** – { id, projectId, section, sectionId?, name, content, metadata, createdAt }
- **ProjectSettings** – { agentModel, strictGrounding, language, exportFormat }
- **CreateMaterialInput** – { projectId, sectionId?, section, name, content, metadata }

### Metadata Structure
Materials store dynamic metadata as JSONB:
```typescript
metadata: {
  authors?: string[],
  year?: number,
  doi?: string,
  caption?: string,
  figureNumber?: number,
  pageText?: string[],    // For PDFs: individual pages
  pageCount?: number
}
```

### Context Budgets
- **MAX_TOKENS_PER_MATERIAL** = 3000 – Materials truncated to this in system prompts
- **MAX_MATERIALS_IN_CONTEXT** = 40 – Max materials included to avoid overflow
- Token estimation: `Math.ceil(text.length / 4)`

### Error Handling
- **API Routes** – Return JSON with { error, code } on failure
- **Server Actions** – Throw errors; let Next.js propagate
- **Async tasks** – Log and catch in `.catch()` handlers; don't throw
- Common error codes: `UNAUTHORIZED`, `BAD_REQUEST`, `NOT_FOUND`, `AI_ERROR`

### Logging & Debugging
Console usage:
- ✅ Allow `console.warn()` and `console.error()` (ESLint rule enforced)
- ❌ Remove `console.log()` before committing (except in lib/agent/ for debugging)
- Use emoji prefixes for clarity:
  - 📄 Processing / 📚 Loading
  - ✅ Success / ❌ Error
  - ⚠️  Warning / 🔍 Retrieval

### Testing Setup
- **Framework:** Vitest (jsdom environment)
- **Mocks:** tests/setup.ts mocks Clerk auth, Next navigation
- **Run single test:** `npx vitest src/path/file.test.ts`
- **Coverage:** `npm test -- --coverage`
- Test files colocated with source (e.g., `rag.test.ts` next to `rag.ts`) OR in `tests/unit/` / `tests/components/`

### Linting & Formatting
- **Linter:** ESLint (extends next/core-web-vitals)
- **Formatter:** Prettier with Tailwind plugin
- **Key rules:**
  - TypeScript strict mode enabled
  - No unused vars (except prefixed with `_`)
  - Prefer `type` imports
  - `prefer-const` enforced
  - Allow `console.warn` and `console.error` only
- **Pre-commit:** Run `npm run lint:fix && npm run format`

## Database Schema Essentials

### projects
```sql
id: uuid
user_id: text          -- Clerk user ID
name, description: text
settings: jsonb        -- { agentModel, strictGrounding, language, exportFormat }
created_at, updated_at: timestamptz
```

### project_sections
```sql
id: uuid
project_id: uuid
name: text
section_type: enum    -- references | drafts | figures | tables | templates | equations | diagrams
display_order: int
is_active: boolean
created_at, updated_at: timestamptz
UNIQUE(project_id, section_type)
```

### materials
```sql
id: uuid
project_id: uuid
section_id: uuid (nullable)  -- NEW: link to project_sections
section: text                -- LEGACY: kept for backward compat
name: text
content: text                -- Full extracted text
metadata: jsonb              -- See above
created_at: timestamptz
```

### chunks
```sql
id: uuid
material_id: uuid
project_id: uuid
content: text          -- Chunk text
embedding: vector      -- 1536-dim OpenAI embedding
metadata: jsonb        -- { chunkIndex, file_name, page, page_end, ... }
created_at: timestamptz
INDEX: idx_chunks_embedding USING hnsw (embedding vector_cosine_ops)
```

## Common Workflows

### Adding a New Material Section Type
1. Update `MaterialSection` type in `src/lib/types/`
2. Add to `SECTION_ORDER` array in `src/lib/agent/contextBuilder.ts`
3. Update `section_type` enum in database schema
4. Add UI component in `src/components/sections/`

### Debugging RAG Issues
1. Visit `/api/health/diagnostics` to check config
2. Verify `OPENAI_API_KEY` and `GITHUB_MODELS_TOKEN` in `.env.local`
3. Check console logs in dev server (look for ✅/❌/⚠️  prefixes)
4. Verify chunks were created: `SELECT COUNT(*) FROM chunks WHERE project_id = '...'`
5. Test embedding: `POST /api/agent` with a small material

### Adding a New API Route
1. Create `src/app/api/path/route.ts`
2. Export `POST`, `GET`, etc. as async functions
3. Check auth: `const { userId } = auth(); if (!userId) return 401;`
4. Check rate limits: `checkRateLimit(key, requests, window)`
5. Return JSON with `Content-Type: application/json`

### Adding a New Server Action
1. Create in `src/app/actions/filename.ts` with `'use server'` at top
2. Extract userId and verify project/resource ownership
3. Use `createServiceClient()` for DB operations
4. Throw errors (don't return error objects)
5. Call from client: `import { actionName } from '@/app/actions'; await actionName(params)`

## Environment Variables

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL              # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY         # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY             # Server-side only
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY     # Clerk frontend key
CLERK_SECRET_KEY                      # Clerk backend key
OPENAI_API_KEY                        # For embeddings (text-embedding-3-small)
GITHUB_MODELS_TOKEN                   # GitHub PAT for GPT-4o access
```

**Optional:**
```
STRIPE_SECRET_KEY                     # Stripe billing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY    # Stripe frontend
```

If any required key is missing, the app will log warnings but may continue (graceful degradation).

## Performance Tips

- **Chunking** happens asynchronously (fire-and-forget) to avoid blocking user
- **Material retrieval** retrieves top-8 chunks by default; increase cautiously to avoid token overflow
- **Context truncation** ensures system prompts stay under ~20k tokens
- **Rate limits** enforced: 30 agent requests per 60 seconds per user
- **Lazy Supabase client** initialized on first use to avoid build failures

## When to Reach Out

If you encounter issues with:
- **RAG not returning results** → Check embeddings API key, verify chunks exist
- **Slow chat responses** → Check database indexes, reduce TOP_K in retrieval
- **Auth errors** → Verify Clerk keys match repo in Clerk dashboard
- **Build/deploy failures** → Check env vars in Vercel dashboard or .env.local
