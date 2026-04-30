'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { GlobalSidebar } from '@/components/ui/GlobalSidebar';

export default function ApiKeysPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) return null;

  return (
    <div className="flex h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <GlobalSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
            <button 
              className="md:hidden p-2 rounded-md hover:bg-[var(--bg-elevated)] transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="hidden sm:inline">API Keys</span>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 w-full">
          <header className="mb-6 md:mb-8">
            <h1 className="text-2xl font-semibold">API Access</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Manage API keys and review usage limits.
            </p>
          </header>

          <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Primary API Key</h2>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="w-full sm:w-auto">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Key</p>
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 rounded-md truncate max-w-full">
                  <p className="text-sm font-mono truncate">yk_live_•••••••••••••••</p>
                </div>
              </div>
              <button
                className="text-xs px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:opacity-80 w-full sm:w-auto mt-2 sm:mt-0 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Rotate key
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                <p className="text-xs text-[var(--text-tertiary)] font-semibold mb-2 uppercase tracking-wide">Limits</p>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between"><span className="text-[var(--text-primary)] font-medium">Chat</span><span>30 req/min</span></li>
                  <li className="flex items-center justify-between"><span className="text-[var(--text-primary)] font-medium">Reports</span><span>10 req/min</span></li>
                  <li className="flex items-center justify-between"><span className="text-[var(--text-primary)] font-medium">Uploads</span><span>50 MB/file</span></li>
                </ul>
              </div>
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                <p className="text-xs text-[var(--text-tertiary)] font-semibold mb-2 uppercase tracking-wide">Scopes</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)]"></div><span className="font-mono text-xs">read:projects</span></li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)]"></div><span className="font-mono text-xs">write:materials</span></li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)]"></div><span className="font-mono text-xs">run:agent</span></li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
