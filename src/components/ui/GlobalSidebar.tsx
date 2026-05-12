'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Settings,
  MessageSquare,
  Mail,
  CreditCard,
  X,
  Compass,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';
import { ThemeToggle } from './ThemeToggle';

const NAVIGATION_GROUPS = [
  {
    title: 'Workspace',
    items: [
      { label: 'Overview', href: '/' },
      { label: 'Explore', href: '/explore' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Integrations', href: '/docs' },
      { label: 'Settings', href: '/settings' },
    ],
  },
];

interface GlobalSidebarProps {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export function GlobalSidebar({ isOpen = false, setIsOpen }: GlobalSidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen?.(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col h-screen w-64 border-r border-border-subtle overflow-y-auto transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: 'var(--bg-surface)' }}>
        {/* Brand Header */}
        <div className="px-8 py-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setIsOpen?.(false)}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: 'var(--accent-primary)' }}>
              <span className="text-white font-bold text-base" style={{ fontFamily: 'var(--font-body)' }}>y</span>
            </div>
            <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>yumeo</span>
          </Link>
          
          <button 
            className="md:hidden p-2 text-text-tertiary hover:bg-bg-surface rounded-full transition-colors"
            onClick={() => setIsOpen?.(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Sections - Text Only as requested */}
        <nav className="flex-1 px-8 space-y-8">
          {NAVIGATION_GROUPS.map((group, idx) => (
            <div key={idx}>
              <h3 className="mb-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-text-tertiary">
                {group.title}
              </h3>
              <div className="flex flex-col space-y-4">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsOpen?.(false)}
                      className={`text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'text-text-primary underline underline-offset-4 decoration-accent-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="px-8 py-8 border-t border-border-subtle">
          <div className="flex items-center gap-3 py-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 grayscale group-hover:grayscale-0 transition-all border border-border-subtle">
               <UserButton afterSignOutUrl="/sign-in" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text-primary truncate">
                {user?.firstName || 'Researcher'}
              </p>
              <p className="text-[10px] text-text-tertiary truncate font-mono">
                PRO PLAN
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
