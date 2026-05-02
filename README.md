# 🎓 Yumeo - The Research IDE

**Yumeo** is an intelligent, integrated development environment (IDE) designed for researchers, academics, and data scientists. It provides a unified workspace to manage literature, data, and writing—powered by an AI assistant that actually *reads* your uploaded materials.

Built with a **Retrieval-Augmented Generation (RAG)** pipeline, Yumeo eliminates AI hallucinations by grounding all responses exclusively in your uploaded documents with precise citations.

---

## 🚀 Core Features

### 📚 **Unified Research Workspace**
- **Zero clutter:** New projects start empty - users add only sections they need
- Click **+ Add Section** to choose from: References, Drafts, Figures, Tables, LaTeX, Mermaid, Templates
- Only enabled sections appear in sidebar and AI context
- Intuitive sidebar with drag-and-drop reordering
- Real-time metadata synchronization

### 🧠 **Intelligent RAG Pipeline**
- **Automatic Chunking:** Uploaded materials are split into 150-400 token semantic chunks with 50-token overlap
- **Vector Embeddings:** Each chunk is embedded using OpenAI's `text-embedding-3-small` (1536-dim vectors)
- **Hybrid Search:** Combines vector similarity (cosine) + full-text search (BM25) for relevance ranking
- **Ground Truth:** AI responses can only reference content from uploaded materials

### 📖 **Grounded AI Assistant**
- Chat interface with streaming responses via GitHub Models (GPT-4o)
- **Inline Citations:** `[REF:1]` citations link directly to source documents
- **System Prompts:** Dynamic prompts built from workspace context (references, drafts, tables, figures)
- **Material Awareness:** Understands figures, tables, equations as workspace context

### 🎨 **Drag-and-Drop Organization**
- Reorder figures/tables with automatic numbering
- Edit captions, metadata, and properties inline
- Persistent metadata storage for each material

### 📄 **Template-Driven Drafting**
- Create structured outlines using Markdown
- AI fills placeholders by synthesizing uploaded sources
- Real-time syntax highlighting and live preview

### 💳 **Tiered Plans**
- **Free:** 1 active project, file uploads, basic AI features
- **Pro:** Unlimited projects, larger files, priority processing (via Stripe)

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|---------------|
| **Frontend** | Next.js 14, React 19, TypeScript, Tailwind CSS |
| **State** | Zustand (chat, materials, projects, UI) |
| **Backend** | Next.js API Routes, Server Actions |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **Auth** | Clerk (user management, JWT) |
| **AI** | OpenAI (embeddings), GitHub Models (LLM) |
| **Payments** | Stripe (subscriptions) |
| **Editors** | TipTap (rich text), CodeMirror (LaTeX/Mermaid) |
| **Export** | docx-js, markdown, LaTeX |

---

## 📁 Project Structure

```
yumeo/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes: sign-in, sign-up
│   │   ├── (workspace)/              # Protected workspace routes
│   │   │   └── [projectId]/          # Project IDE view
│   │   ├── actions/                  # Server actions
│   │   │   ├── projects.ts           # Project CRUD operations
│   │   │   ├── materials.ts          # Material upload & chunking
│   │   │   └── sections.ts           # Section management (NEW: dynamic sections)
│   │   ├── api/                      # API routes
│   │   │   ├── agent/route.ts        # AI chat endpoint
│   │   │   ├── health/
│   │   │   │   └── diagnostics/      # Config validation
│   │   │   ├── projects/route.ts     # Project REST API
│   │   │   ├── generate/             # Export generation
│   │   │   ├── stripe/               # Subscription webhooks
│   │   │   ├── vision/               # Image analysis
│   │   │   └── checkout/             # Stripe checkout
│   │   ├── docs/                     # Documentation pages
│   │   ├── pricing/                  # Pricing page
│   │   ├── settings/                 # User settings
│   │   └── page.tsx                  # Dashboard (home)
│   │
│   ├── components/                   # React components
│   │   ├── chat/                     # Chat UI (messages, input, citations)
│   │   ├── editor/                   # Rich text editor
│   │   ├── ide/                      # Main IDE layout (sidebar, editor, chat)
│   │   ├── sections/                 # Section management (NEW: AddSectionButton, ProjectEmptyState)
│   │   ├── template/                 # Template editor & generator
│   │   ├── ui/                       # Global UI (sidebar, theme)
│   │   └── upload/                   # File upload zone
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useMaterials.ts           # Material store subscriptions
│   │   ├── useProject.ts             # Project data fetching
│   │   ├── useStreamingChat.ts       # Chat streaming logic
│   │   └── useTemplateGen.ts         # Template generation
│   │
│   ├── lib/                          # Core utilities
│   │   ├── agent/                    # RAG & AI logic
│   │   │   ├── buildSystemPrompt.ts  # Dynamic prompt builder
│   │   │   ├── citationParser.ts     # Citation extraction
│   │   │   ├── contextBuilder.ts     # Workspace context assembly
│   │   │   ├── rag.ts                # Chunking, embeddings, retrieval
│   │   │   └── reportValidation.ts   # Output validation
│   │   ├── db/                       # Database helpers
│   │   │   ├── schema.sql            # Full schema definition
│   │   │   ├── projects.ts           # Project queries
│   │   │   ├── materials.ts          # Material queries
│   │   │   └── supabase.ts           # Supabase client setup
│   │   ├── github/                   # GitHub API integration
│   │   ├── parsers/                  # PDF, DOCX parsers
│   │   ├── security/                 # Rate limiting, validation
│   │   ├── stripe/                   # Stripe integration
│   │   ├── types/                    # TypeScript definitions
│   │   └── utils/                    # Helpers (truncate, sanitize, etc.)
│   │
│   ├── stores/                       # Zustand state management
│   │   ├── chatStore.ts              # Messages & streaming state
│   │   ├── materialsStore.ts         # Materials indexed by section
│   │   ├── projectSectionsStore.ts   # Dynamic sections (NEW)
│   │   ├── projectStore.ts           # Active project & settings
│   │   └── uiStore.ts                # UI state (sidebar, theme)
│   │
│   └── middleware.ts                 # Clerk auth middleware
│
├── tests/                            # Vitest unit & integration tests
│   ├── components/                   # Component tests
│   ├── unit/                         # Logic tests (RAG, parsing, etc.)
│   └── setup.ts                      # Test configuration
│
├── public/                           # Static assets
│   └── pdf.worker.min.mjs            # PDF.js worker
│
├── .env.local.example                # Environment template
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # Tailwind setup
├── vitest.config.ts                  # Test runner config
└── next.config.mjs                   # Next.js config
```

---

## 🗄️ Database Schema

### **Projects Table**
Stores user research projects with settings.
```sql
projects (
  id: uuid,                    -- Unique project ID
  user_id: text,               -- Clerk user ID
  name: text,                  -- Project name
  description: text,           -- Optional description
  settings: jsonb {            -- Agent configuration
    agentModel: "gpt-4o",
    strictGrounding: boolean,
    language: "en",
    exportFormat: "markdown"
  },
  created_at: timestamptz,
  updated_at: timestamptz
)
```

### **Project Sections Table** (NEW)
User-created sections within each project.
```sql
project_sections (
  id: uuid,
  project_id: uuid,           -- Which project this belongs to
  name: text,                 -- User-friendly name ("My References")
  section_type: enum {        -- Type: references, drafts, figures,
    'references',             --       tables, templates, equations, diagrams
    'drafts',
    'figures',
    'tables',
    'templates',
    'equations',
    'diagrams'
  },
  display_order: int,         -- Sort order in sidebar
  is_active: boolean,         -- Shown in UI & AI context?
  created_at: timestamptz,
  updated_at: timestamptz,
  unique(project_id, section_type)  -- One of each type per project
)
```

### **Materials Table**
Stores all project materials (PDFs, drafts, figures, etc.).
```sql
materials (
  id: uuid,
  project_id: uuid,           -- Foreign key to projects
  section_id: uuid,           -- NEW: Reference to project_sections
  section: text,              -- Legacy: kept for backward compat
  name: text,                 -- File/material name
  content: text,              -- Full content (PDFs extracted as text)
  storage_url: text,          -- Optional: S3/Supabase Storage URL
  metadata: jsonb {           -- Dynamic metadata
    authors?: string[],
    year?: number,
    doi?: string,
    caption?: string,
    figureNumber?: number,
    pageText?: string[]       -- For PDFs: pages as array
  },
  created_at: timestamptz
)
```

### **Chunks Table** (RAG Index)
Vector embeddings of material sections for semantic search.
```sql
chunks (
  id: uuid,
  material_id: uuid,          -- Which material this chunk came from
  project_id: uuid,           -- For RLS & efficiency
  content: text,              -- 150-400 tokens of text
  embedding: vector(1536),    -- 1536-dim OpenAI embedding
  search_tsvector: tsvector,  -- PostgreSQL full-text index
  metadata: jsonb {           -- Chunk metadata
    chunkIndex: number,
    file_id: uuid,
    file_name: string,
    author: string | null,
    page: number,
    page_end: number,
    section_title: string | null
  },
  created_at: timestamptz
)
```

### **Messages Table**
Chat history with citations.
```sql
messages (
  id: uuid,
  project_id: uuid,           -- Which project this chat belongs to
  user_id: text,              -- Clerk user ID
  role: enum { 'user', 'assistant', 'system' },
  content: text,              -- Message text
  citations: jsonb {          -- References to source materials
    refId: number,
    text: string,
    source?: string
  }[],
  model: text,                -- Which model generated (if assistant)
  created_at: timestamptz
)
```

### **User Plans Table**
Subscription state for billing.
```sql
user_plans (
  user_id: text,              -- Primary key
  plan: enum { 'free', 'pro' },
  stripe_customer_id: text,
  stripe_subscription_id: text,
  updated_at: timestamptz
)
```

---

## 🔌 API Endpoints

### **Chat / AI Agent**
```http
POST /api/agent
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "What is the methodology?" },
    { "role": "assistant", "content": "..." }
  ],
  "systemPrompt": "You are a research assistant...",
  "projectId": "uuid",
  "userQuery": "What is the methodology?",
  "model": "gpt-4o"
}

Response: Stream of text chunks (grounded AI response with [REF:n] citations)
```

### **Projects REST API**
```http
# List projects for authenticated user
GET /api/projects

# Create new project
POST /api/projects
{
  "name": "Quantum Computing Review",
  "description": "Lit review for Q-comp paper",
  "settings": { ... }
}

# Delete project
DELETE /api/projects?id={projectId}
```

### **Server Actions** (used by client)
```typescript
// Create material (triggers embedding)
createMaterialAction({
  projectId: string,
  section: 'references' | 'drafts' | 'figures' | ... ,
  name: string,
  content: string,
  metadata: {...}
})

// Update project settings
updateProjectAction(projectId, { name?, description?, settings? })

// Delete project
deleteProjectAction(projectId)

// Update material order/metadata
updateMaterialOrderAction(projectId, updates[])

// Update single material
updateMaterialAction(materialId, { content?, metadata? })
```

### **Health & Diagnostics**
```http
GET /api/health/diagnostics

Response:
{
  "status": "OK" | "WARNING" | "ERROR",
  "auth": { authenticated: boolean },
  "environment": {
    hasOpenAIKey: boolean,
    hasGithubModelsToken: boolean,
    hasSupabaseUrl: boolean,
    ...
  },
  "issues": ["❌ OPENAI_API_KEY not configured"],
  "recommendations": ["Set OPENAI_API_KEY to enable RAG"]
}
```

---

## 🧠 RAG Pipeline Explained

### **1. Material Upload**
User uploads a PDF/document to the "References" section.
- File is parsed (PDFs → text, DOCX via docx-js)
- Full text stored in `materials.content`
- `chunkAndEmbedMaterial()` triggered via server action (fire-and-forget)

### **2. Chunking**
```
Input: "The quick brown fox jumps over the lazy dog..."
        ↓
Split into paragraphs by double newlines
        ↓
Each paragraph chunked to 150-400 tokens with 50-token overlap
        ↓
Output: ["The quick brown fox...", "brown fox jumps over...", ...]
```

**Key Logic** (src/lib/agent/rag.ts):
- `CHUNK_MIN_TOKENS = 150`
- `CHUNK_MAX_TOKENS = 400`
- `CHUNK_OVERLAP_TOKENS = 50`

### **3. Embedding**
Each chunk is sent to OpenAI's embedding API:
```
Chunk: "The methodology uses a Bayesian approach..."
  ↓
POST https://api.openai.com/v1/embeddings
  model: "text-embedding-3-small"
  ↓
Response: [0.123, -0.456, ..., 0.789] (1536 dimensions)
  ↓
Stored in Supabase pgvector column
```

### **4. Retrieval (on User Query)**
User asks: *"What is the methodology?"*

```
Query embedding generated via OpenAI
  ↓
Hybrid search via RPC function:
  - Vector similarity: cosine distance
  - Full-text rank: BM25 score
  - Combined score: 0.7 × vector_sim + 0.3 × text_rank
  ↓
Top-K=8 most relevant chunks retrieved
  ↓
Added to system prompt as context
```

### **5. Generation**
```
Final system prompt:
  Base prompt + retrieved chunks + workspace context
  ↓
Send to GitHub Models (GPT-4o):
  POST https://models.inference.ai.azure.com/chat/completions
  ↓
Stream response back to client
  ↓
Citation parser extracts [REF:n] citations
  ↓
Links citations to source materials
```

---

## ⚙️ Setup & Installation

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Git

### **1. Clone Repository**
```bash
git clone https://github.com/BekdauletBol/yumeo.git
cd yumeo
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Configure Environment Variables**
```bash
cp .env.local.example .env.local
```

**Required Keys:**

| Variable | Source | Purpose |
|----------|--------|---------|
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) | Text embeddings for RAG |
| `GITHUB_MODELS_TOKEN` | GitHub Settings → Developer → Tokens | LLM API access (GPT-4o) |
| `NEXT_PUBLIC_SUPABASE_URL` | [Supabase Dashboard](https://app.supabase.com) | Database host |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API Keys | Public client access |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API Keys | Server-side operations |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard](https://dashboard.clerk.com) | Auth frontend |
| `CLERK_SECRET_KEY` | Clerk → API Keys | Auth backend |

### **4. Initialize Database**
```bash
# Copy contents of src/lib/db/schema.sql
# Paste into Supabase → SQL Editor → Run
```

### **5. Enable Vector Index**
```sql
create index if not exists idx_chunks_embedding on chunks 
  using hnsw (embedding vector_cosine_ops);
```

### **6. Start Development Server**
```bash
npm run dev
# Runs on http://localhost:3010
```

---

## 🚀 Running & Deployment

### **Local Development**
```bash
npm run dev         # Start dev server (port 3010)
npm run lint        # Check code quality
npm run test        # Run Vitest
npm run typecheck   # TypeScript validation
```

### **Production Build**
```bash
npm run build       # Build Next.js app
npm start           # Start production server
```

### **Deploy to Vercel**
```bash
git push origin main
# Vercel auto-deploys, set env vars in dashboard
```

---

## 🐛 Troubleshooting

### **AI Says "I don't have information"**
1. Visit `http://localhost:3010/api/health/diagnostics`
2. Check if `OPENAI_API_KEY` is configured
3. Set key in `.env.local` and restart dev server
4. Delete old materials and re-upload them

### **Chat Returns Error**
1. Verify `GITHUB_MODELS_TOKEN` is set in `.env.local`
2. Check token expiration in GitHub Settings
3. Restart dev server

### **Slow Chunk Retrieval**
```sql
-- Run in Supabase SQL editor:
create index if not exists idx_chunks_embedding on chunks 
  using hnsw (embedding vector_cosine_ops);
```

---

## 📊 State Management (Zustand)

- **ChatStore** - Messages & streaming
- **MaterialsStore** - Materials by section
- **ProjectStore** - Active project & settings
- **UIStore** - Theme & layout

---

## 🧪 Testing

```bash
npm test                 # Run all tests
npm test -- --ui         # Interactive test UI
npm test -- --coverage   # Coverage report
```

---

## 🔐 Security

✅ API keys server-only  
✅ Rate limiting (30 req/min per user)  
✅ Row-Level Security (RLS) policies  
✅ Clerk JWT authentication  
✅ Input validation & sanitization  

---

## 📄 License

MIT License - See LICENSE file for details

---

## ✨ Credits

Built with:
- [Next.js](https://nextjs.org) - React framework
- [Supabase](https://supabase.com) - Database & Auth
- [Clerk](https://clerk.com) - Authentication
- [OpenAI](https://openai.com) - Embeddings
- [Stripe](https://stripe.com) - Payments
