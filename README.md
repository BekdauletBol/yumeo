# Yumeo - The Research IDE

Yumeo is an intelligent, integrated development environment built for researchers, academics, and data scientists. It provides a unified workspace to manage literature, data, and writing, powered by an AI assistant that actually *reads* your materials.

Built for the Y Combinator MVP demo, Yumeo connects a robust document management system with an advanced Retrieval-Augmented Generation (RAG) pipeline to eliminate hallucinations and streamline academic drafting.

## 🚀 Key Features

* **Unified Workspace:** Manage PDFs, datasets, images, LaTeX equations, and Mermaid diagrams all in one place.
* **Intelligent RAG Pipeline:** Uploaded materials are chunked and embedded via OpenAI/pgvector. The built-in Claude AI searches these vectors to ground its answers exclusively in your uploaded facts.
* **Strict Citations:** The AI assistant provides exact `[REF:n]` inline citations linked directly to your uploaded materials.
* **Drag-and-Drop Organization:** Reorder figures and tables intuitively. Real-time metadata updates keep your captions and numbering in sync.
* **Template-Driven Drafting:** Create a Markdown structure with placeholders (e.g., `{{ methodology }}`). The AI will fill out the template by synthesizing your uploaded sources.
* **Bring Your Own Key (BYOK):** Securely save your own Anthropic API key to your profile.
* **Seamless Exports:** Export your drafted research seamlessly to `.docx`, `.md`, or `.tex`.

## 🛠️ Technology Stack

* **Framework:** Next.js 14 (App Router)
* **Language:** TypeScript
* **Database & Storage:** Supabase (PostgreSQL with `pgvector` for RAG)
* **Authentication:** Clerk
* **AI Models:** Anthropic Claude (Opus/Sonnet) for generation, OpenAI for text embeddings
* **State Management:** Zustand
* **Monetization:** Stripe (Pro Upgrades)
* **Styling:** Tailwind CSS & Vanilla CSS Variables

---

## 📖 User Tutorial: How to Use Yumeo

### Phase 1: Setup & Initialization
1. **Sign In:** Create an account using Clerk authentication.
2. **Configure AI:** Navigate to settings to securely input your Anthropic API Key.
3. **Start a Project:** Click **New Project** and name your workspace (e.g., "Quantum Computing Lit Review").

### Phase 2: Building Your Knowledge Base
Populate the sidebar with the materials you need for your paper:
1. **References & Drafts:** Drag and drop PDFs and text files. Yumeo will automatically chunk the text and store the vector embeddings in Supabase.
2. **Media & Data:** Upload charts to **Figures** and datasets to **Tables**. You can click to edit their captions inline and drag them to reorder their numbering.
3. **Custom Assets:** Open the built-in **LaTeX** and **Mermaid** editors to design equations and flowcharts. Click **Save** to permanently add them to your workspace context.

### Phase 3: AI-Assisted Research
Instead of juggling a dozen PDF tabs, open the **Chat Panel**:
1. **Ask a Question:** *"What are the limitations of the methodology mentioned in Reference 2?"*
2. **Grounded Answers:** Yumeo's RAG pipeline retrieves the exact paragraphs from your database. Claude answers your question using *only* the facts from your workspace, providing clickable `[REF]` citations.
3. **Vision Analysis:** Ask Claude to analyze the charts you uploaded to the Figures section to extract data or suggest academic captions.

### Phase 4: Drafting & Exporting
1. **Create a Template:** Open the **Templates** section and outline your paper using Yumeo's placeholder syntax (e.g., `{{ introduction }}`, `{{ abstract }}`).
2. **Generate:** Click **Generate from Materials**. Yumeo will synthesize your references, figures, and equations to write a fully cited draft.
3. **Publish:** Review the output and export it directly to LaTeX, Microsoft Word, or Markdown.

---

## 💻 Local Development Setup

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/yourusername/yumeo.git
   cd yumeo
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Variables:**
   Copy the example environment file:
   \`\`\`bash
   cp .env.local.example .env.local
   \`\`\`
   Fill in your keys for Clerk, Supabase, Anthropic, and Stripe.

4. **Database Migration:**
   Run the SQL provided in \`lib/db/schema.sql\` in your Supabase SQL Editor to configure the tables, constraints, and \`pgvector\` RPC functions.

5. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   The app will be available at \`http://localhost:3009\`.
