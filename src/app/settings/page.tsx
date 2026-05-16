'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, Trash2, CreditCard, Key, ShieldCheck, Palette } from 'lucide-react';
import { GlobalSidebar } from '@/components/ui/GlobalSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function SettingsPage() {
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
            <span className="hidden sm:inline">Settings</span>
          </div>
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 w-full space-y-10">
          {/* Profile Section */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-4 px-1 flex items-center gap-2">
              <ShieldCheck size={14} /> Profile
            </h2>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.imageUrl} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-semibold text-lg">{user.fullName || 'Researcher'}</p>
                <p className="text-sm text-[var(--text-secondary)]">{user.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
          </section>

          {/* Appearance Section */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-4 px-1 flex items-center gap-2">
              <Palette size={14} /> Appearance
            </h2>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-[var(--text-secondary)]">Switch between light and dark mode</p>
              </div>
              <ThemeToggle />
            </div>
          </section>

          {/* API Keys Section */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-4 px-1 flex items-center gap-2">
              <Key size={14} /> API Access
            </h2>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">Primary API Key</p>
                  <p className="text-sm text-[var(--text-secondary)]">Used for Yumeo API and B2A access</p>
                </div>
                <button className="text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:opacity-80 transition-opacity">
                  Rotate
                </button>
              </div>
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-4 py-2.5 rounded-lg font-mono text-sm text-[var(--text-secondary)] truncate">
                yk_live_••••••••••••••••••••••••••••
              </div>
            </div>
          </section>

          {/* Billing Section */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-4 px-1 flex items-center gap-2">
              <CreditCard size={14} /> Billing & Plan
            </h2>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-medium">Current Plan</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold uppercase">Free</span>
                    <span className="text-sm text-[var(--text-secondary)]">· 5 projects remaining</span>
                  </div>
                </div>
                <button 
                  onClick={() => router.push('/pricing')}
                  className="text-sm px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Upgrade to Pro
                </button>
              </div>
              <div className="pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <p className="text-sm text-[var(--text-secondary)]">Manage your subscription, invoices, and payment methods.</p>
                <button className="text-sm font-medium hover:underline flex items-center gap-1.5 text-[var(--text-secondary)]">
                  Stripe Portal
                </button>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--status-error)] mb-4 px-1 flex items-center gap-2">
              <Trash2 size={14} /> Danger Zone
            </h2>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 flex items-center justify-between">
              <div>
                <p className="font-medium text-red-500">Delete Account</p>
                <p className="text-sm text-[var(--text-secondary)]">Permanently remove your account and all associated data</p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
