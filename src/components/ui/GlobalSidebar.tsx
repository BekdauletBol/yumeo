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
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
import { ThemeToggle } from './ThemeToggle';

const FEEDBACK_EMAIL = 'yumeo.lab@gmail.com';
const DISCORD_INVITE = 'https://discord.gg/yumeo'; // replace with real link when ready

const NAVIGATION_GROUPS = [
  {
    title: 'Main',
    items: [
      { label: 'Home', href: '/', icon: Home },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Integrations & Providers', href: '/docs', icon: Settings },
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen?.(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 flex flex-col h-screen w-64 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] overflow-y-auto transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="px-6 py-6 pt-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={() => setIsOpen?.(false)}>
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <Image src="/logo.png" alt="Yumeo logo" width={24} height={24} priority />
            </span>
            <span className="text-lg font-semibold text-[var(--text-primary)]">Yumeo</span>
          </Link>
          
          {/* Mobile Close Button */}
          <button 
            className="md:hidden p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-md"
            onClick={() => setIsOpen?.(false)}
          >
            <X size={20} />
          </button>
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
                      onClick={() => setIsOpen?.(false)}
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

          {/* Community / Support links */}
          <div className="pt-2 space-y-1">
            {/* Join Discord — opens invite when you have one */}
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen?.(false)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
            >
              <MessageSquare size={18} className="opacity-70" />
              Join Discord
            </a>

            {/* Give Feedback — opens Gmail compose to your address */}
            <a
              href={`https://mail.google.com/mail/?view=cm&to=${FEEDBACK_EMAIL}&su=Yumeo%20Feedback&body=Hi%20Yumeo%20team%2C%0A%0A`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen?.(false)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
            >
              <Mail size={18} className="opacity-70" />
              Give Feedback
            </a>

            {/* Billing — subtle single icon-only button, no text label */}
            <Link
              href="/pricing"
              onClick={() => setIsOpen?.(false)}
              title="Billing & subscription"
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-all opacity-50 hover:opacity-100"
            >
              <CreditCard size={18} className="opacity-70" />
              <span className="sr-only">Billing</span>
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
    </>
  );
}
