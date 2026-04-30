import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { GlobalSidebar } from '@/components/ui/GlobalSidebar';

const PROVIDERS = [
  { name: 'Clerk', env: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY' },
  { name: 'Supabase', env: 'NEXT_PUBLIC_SUPABASE_URL' },
  { name: 'GitHub Models', env: 'GITHUB_MODELS_TOKEN' },
  { name: 'OpenAI Embeddings', env: 'OPENAI_API_KEY' },
  { name: 'Stripe', env: 'STRIPE_SECRET_KEY' },
];

export default async function SettingsPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const providerStatus = PROVIDERS.map((provider) => ({
    name: provider.name,
    env: provider.env,
    connected: Boolean(process.env[provider.env]),
  }));

  return (
    <div className="flex h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <GlobalSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold">Integrations & Providers</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Manage infrastructure providers that power ingestion, RAG, and billing.
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {providerStatus.map((provider) => (
              <div
                key={provider.env}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{provider.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{provider.env}</p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: provider.connected ? 'rgba(64, 192, 87, 0.15)' : 'rgba(250, 82, 82, 0.15)',
                      color: provider.connected ? 'var(--status-success)' : 'var(--status-error)',
                    }}
                  >
                    {provider.connected ? 'Connected' : 'Not configured'}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  {provider.connected
                    ? 'Ready to serve requests.'
                    : 'Add the environment variable to enable this provider.'}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 mb-8">
            <h2 className="text-lg font-semibold mb-3">Setup Checklist</h2>
            <ol className="text-sm text-[var(--text-secondary)] list-decimal list-inside space-y-2">
              <li>Copy .env.local.example to .env.local and fill in keys.</li>
              <li>Run the SQL in lib/db/schema.sql inside Supabase.</li>
              <li>Create a Supabase Storage bucket named “materials”.</li>
              <li>Create a Stripe Product with a recurring price.</li>
              <li>Run the app and verify provider status above.</li>
            </ol>
          </section>

          <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
            <h2 className="text-lg font-semibold mb-3">Security & Isolation</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Yumeo enforces row-level security and strict project isolation. Every chunk, message, and
              material is scoped by project_id so cross-project access is never allowed.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
