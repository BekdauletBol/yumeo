'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BarChart3,
  Key,
  CreditCard,
  Settings,
  BookOpen,
  MessageSquare,
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
import { ThemeToggle } from './ThemeToggle';

const NAVIGATION_GROUPS = [
  {
    title: 'Main',
    items: [
      { label: 'Home', href: '/', icon: Home },
    ],
  },
  {
    title: 'API',
    items: [
      { label: 'API Keys', href: '/docs', icon: Key },
    ],
  },
  {
    title: 'Billing',
    items: [
      { label: 'Billing', href: '/pricing', icon: CreditCard },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Integrations & Providers', href: '/docs', icon: Settings },
    ],
  },
];

export function GlobalSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] w-64 overflow-y-auto">
      {/* Brand Header */}
      <div className="px-6 py-6 pt-8">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <Image src="/logo.png" alt="Yumeo logo" width={24} height={24} priority />
          </span>
          <span className="text-lg font-semibold text-[var(--text-primary)]">Yumeo</span>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-4 py-2 space-y-6">
        {NAVIGATION_GROUPS.map((group, idx) => (
          <div key={idx}>
            <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-[var(--text-tertiary)]">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`group flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <item.icon size={18} className="flex-shrink-0 opacity-70" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-4">
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">API Access</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">Pro</span>
            </div>
            <div className="text-sm font-medium">Unlimited</div>
          </div>
        </div>

        <div className="pt-2 space-y-1">
          <Link href="/docs" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all">
            <MessageSquare size={18} className="opacity-70" />
            Join Discord
          </Link>
          <Link href="/docs" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all">
            <MessageSquare size={18} className="opacity-70" />
            Give Feedback
          </Link>
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="p-4 space-y-4 pb-6">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between px-4 py-2 text-[var(--text-secondary)]">
          <span className="text-sm font-medium">Theme</span>
          <ThemeToggle />
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border-subtle)]">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-template)] flex items-center justify-center flex-shrink-0 text-white font-bold">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {user?.firstName || 'User'}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
