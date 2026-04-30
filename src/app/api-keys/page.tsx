import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { GlobalSidebar } from '@/components/ui/GlobalSidebar';

export default async function ApiKeysPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="flex h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <GlobalSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold">API Access</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Manage API keys and review usage limits.
            </p>
          </header>

          <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Primary API Key</h2>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Key</p>
                <p className="text-sm font-mono">yk_live_•••••••••••••••</p>
              </div>
              <button
                className="text-xs px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                Rotate key
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Requests / day', value: '1,200' },
              { label: 'Error rate', value: '0.6%' },
              { label: 'Avg latency', value: '820ms' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
              >
                <p className="text-xs text-[var(--text-tertiary)]">{stat.label}</p>
                <p className="text-2xl font-semibold mt-2">{stat.value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
            <h2 className="text-lg font-semibold mb-3">Rate Limits & Scopes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                <p className="text-xs text-[var(--text-tertiary)] mb-2">Limits</p>
                <ul className="space-y-1">
                  <li>Chat: 30 requests / minute</li>
                  <li>Reports: 10 requests / minute</li>
                  <li>Uploads: 50 MB per file</li>
                </ul>
              </div>
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                <p className="text-xs text-[var(--text-tertiary)] mb-2">Scopes</p>
                <ul className="space-y-1">
                  <li>read:projects</li>
                  <li>write:materials</li>
                  <li>run:agent</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
