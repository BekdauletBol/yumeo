'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, FolderOpen, ArrowRight } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import type { Project } from '@/lib/types';

interface GlobalSidebarProps {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export function GlobalSidebar({ isOpen = false, setIsOpen }: GlobalSidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  // Fetch recent projects for sidebar
  useEffect(() => {
    if (user) {
      fetch('/api/projects')
        .then(res => res.ok ? res.json() : [])
        .then(data => setProjects((data || []).slice(0, 5)))
        .catch(() => {});
    }
  }, [user]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen?.(false)}
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col h-screen w-64 border-r border-border-subtle overflow-y-auto transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--bg-surface)' }}
      >
        {/* Brand */}
        <div className="px-6 py-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setIsOpen?.(false)}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: 'var(--accent-primary)' }}>
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-body)' }}>y</span>
            </div>
            <span className="text-base font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>yumeo</span>
          </Link>
          
          <button 
            className="md:hidden p-2 rounded-full transition-colors"
            onClick={() => setIsOpen?.(false)}
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-6">
          {/* Main nav */}
          <div>
            <p className="text-[11px] font-medium mb-2 px-2" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
              navigation
            </p>
            <div className="space-y-0.5">
              {[
                { label: 'overview', href: '/' },
                { label: 'docs', href: '/docs' },
                { label: 'settings', href: '/settings' },
              ].map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsOpen?.(false)}
                    className="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{ 
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: active ? 'var(--bg-elevated)' : 'transparent',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Dashboard — recent projects */}
          <div>
            <p className="text-[11px] font-medium mb-2 px-2" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
              dashboard
            </p>
            <div className="space-y-0.5">
              {projects.length === 0 ? (
                <p className="px-3 py-2 text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
                  no projects yet
                </p>
              ) : (
                projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/${project.id}`}
                    onClick={() => setIsOpen?.(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 group"
                    style={{ 
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <FolderOpen size={14} className="shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                    <span className="flex-1 truncate">{project.name}</span>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  </Link>
                ))
              )}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3 px-2">
            <UserButton afterSignOutUrl="/sign-in" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                {user?.firstName || 'researcher'}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
                pro plan
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
