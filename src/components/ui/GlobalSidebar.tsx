'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Settings, BookOpen, CreditCard, MessageSquare, Plus, UserCircle } from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Overview', href: '/', icon: LayoutGrid },
];

const SETTINGS_ITEMS = [
  { label: 'Integrations', href: '#', icon: Settings },
  { label: 'Billing', href: '/pricing', icon: CreditCard },
  { label: 'Docs', href: '/docs', icon: BookOpen },
];

const COMMUNITY_ITEMS = [
  { label: 'Discord', href: '#', icon: MessageSquare },
];

export function GlobalSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <div className="flex flex-col h-full bg-bg-surface border-r border-border-subtle w-60">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-text-primary rounded-lg flex items-center justify-center">
          <span className="text-bg-surface font-bold text-lg">Y</span>
        </div>
        <span className="text-display text-lg tracking-tight">Yumeo</span>
      </div>

      {/* Nav Sections */}
      <div className="flex-1 px-4 py-2 space-y-6 overflow-y-auto">
        <div>
          <div className="text-section-label px-2 mb-2">Main</div>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href 
                    ? 'bg-bg-elevated text-text-primary shadow-sm' 
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="text-section-label px-2 mb-2">Settings</div>
          <div className="space-y-1">
            {SETTINGS_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="text-section-label px-2 mb-2">Support</div>
          <div className="space-y-1">
            {COMMUNITY_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 mt-auto border-t border-border-subtle space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-text-tertiary">Theme</span>
          <ThemeToggle />
        </div>
        
        <div className="p-2 rounded-xl bg-bg-elevated flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/sign-in" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.firstName || 'User'}</p>
              <p className="text-[10px] text-text-tertiary truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
