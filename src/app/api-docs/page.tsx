import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { GlobalSidebar } from '@/components/ui/GlobalSidebar';

export default async function ApiDocsPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="flex h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <GlobalSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold">API Documentation</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Quickstart guides and request formats for the Yumeo research API.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
            <aside className="hidden lg:block sticky top-8 h-fit">
              <nav className="space-y-2 text-sm">
                {[
                  { label: 'Quickstart', href: '#quickstart' },
                  { label: 'Authentication', href: '#auth' },
                  { label: 'RAG Rules', href: '#rag-rules' },
                  { label: 'Responses', href: '#responses' },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded px-2 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </aside>

            <section className="space-y-8">
              <div id="quickstart" className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
                <h2 className="text-lg font-semibold mb-3">Quickstart</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Use the agent endpoint for chat, and the generate endpoint for reports.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] mb-2">POST /api/agent</p>
                    <pre className="text-xs rounded-lg p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-x-auto">
{`{
  "projectId": "...",
  "userQuery": "Summarize the methodology",
  "model": "gpt-4o",
  "messages": [
    { "role": "user", "content": "Summarize the methodology" }
  ]
}`}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] mb-2">POST /api/generate</p>
                    <pre className="text-xs rounded-lg p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-x-auto">
{`{
  "projectId": "...",
  "userQuery": "Generate report",
  "templateBody": "# {{title}}\n\n## Abstract\n{{abstract}}"
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div id="auth" className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
                <h2 className="text-lg font-semibold mb-3">Authentication</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  The API runs server-side and uses environment variables for provider access.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center justify-between rounded-md bg-[var(--bg-elevated)] px-3 py-2">
                    <span>GITHUB_MODELS_TOKEN</span>
                    <span className="text-[var(--text-tertiary)]">required for gpt-4o</span>
                  </li>
                  <li className="flex items-center justify-between rounded-md bg-[var(--bg-elevated)] px-3 py-2">
                    <span>OPENAI_API_KEY</span>
                    <span className="text-[var(--text-tertiary)]">embeddings</span>
                  </li>
                  <li className="flex items-center justify-between rounded-md bg-[var(--bg-elevated)] px-3 py-2">
                    <span>NEXT_PUBLIC_SUPABASE_URL</span>
                    <span className="text-[var(--text-tertiary)]">storage + metadata</span>
                  </li>
                </ul>
              </div>

              <div id="rag-rules" className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
                <h2 className="text-lg font-semibold mb-3">RAG Rules</h2>
                <ul className="text-sm text-[var(--text-secondary)] space-y-2">
                  <li>All answers come from retrieved chunks (no external knowledge).</li>
                  <li>Missing knowledge returns: “I don’t have information about this in your uploaded materials.”</li>
                  <li>Every response ends with a Sources line listing filename + page.</li>
                  <li>Report generation runs two-pass audit and blocks export if citations fail.</li>
                </ul>
              </div>

              <div id="responses" className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
                <h2 className="text-lg font-semibold mb-3">Response Examples</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] mb-2">Chat Response</p>
                    <pre className="text-xs rounded-lg p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-x-auto">
{`The method follows a two-stage encoder... [REF:chunk_id]

Sources: [paper.pdf, p.12]`}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] mb-2">Report JSON</p>
                    <pre className="text-xs rounded-lg p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-x-auto">
{`{
  "draft": { "sections": [...], "citedChunkIds": [...] },
  "audit": [ { "sentence": "...", "status": "SUPPORTED" } ],
  "validation": { "hasUnverified": false },
  "bibliography": ["Author (2022) Paper Title"]
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
