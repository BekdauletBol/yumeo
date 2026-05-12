'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Plus, Menu, Sun, Moon, ArrowRight, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import type { Project } from '@/lib/types';
import { GlobalSidebar } from '@/components/ui/GlobalSidebar';

export function DashboardView() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setError(null);
        const response = await fetch('/api/projects');
        if (!response.ok) {
          setError(`Failed to load projects (${response.status})`);
          return;
        }
        const data = await response.json();
        setProjects(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      }
    };
    if (user) fetchProjects();
  }, [user]);

  if (!user) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'good morning' : hour < 18 ? 'good afternoon' : 'good evening';

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <GlobalSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <main className="flex-1 overflow-y-auto flex flex-col w-full relative scrollbar-thin">
        {/* Top bar — minimal, folk-style */}
        <header 
          className="h-14 flex items-center justify-between px-6 md:px-10 sticky top-0 backdrop-blur-md z-10 shrink-0"
          style={{ background: 'color-mix(in srgb, var(--bg-base) 85%, transparent)' }}
        >
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 rounded-full transition-colors"
              onClick={() => setSidebarOpen(true)}
              style={{ color: 'var(--text-secondary)' }}
            >
              <Menu size={18} />
            </button>
            <Link href="/" className="flex items-center gap-2.5 group">
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ background: 'var(--accent-primary)' }}
              >
                <span className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-body)' }}>y</span>
              </div>
              <span className="hidden sm:inline text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                yumeo
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg transition-colors hover:opacity-70"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        <div className="flex-1 px-6 md:px-10 pb-20 max-w-5xl mx-auto w-full">
          {/* Hero area — folk inspired, lowercase, clean */}
          <div className="pt-16 md:pt-24 pb-16">
            <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
              {greeting}, {user.firstName?.toLowerCase() || 'researcher'}.
            </p>
            <h1 
              className="text-3xl md:text-4xl font-medium leading-tight"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              your research workspace.
            </h1>
            <p 
              className="text-base md:text-lg mt-3 leading-relaxed max-w-lg"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
            >
              upload papers. ask questions. write reports.
              <br />
              every AI answer is grounded in your materials.
            </p>
          </div>

          {/* Quick stats — horizontal pill row */}
          <div className="flex flex-wrap gap-3 mb-10">
            {[
              { label: 'projects', value: projects.length },
              { label: 'references', value: '—' },
              { label: 'reports', value: '—' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                style={{ 
                  background: 'var(--bg-surface)', 
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <span style={{ color: 'var(--text-tertiary)' }}>{stat.label}</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Section header + new project */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
              recent workspaces
            </h2>
            <Link 
              href="/projects/new" 
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90"
              style={{ background: 'var(--accent-primary)', fontFamily: 'var(--font-body)' }}
            >
              <Plus size={14} /> new project
            </Link>
          </div>

          {error && (
            <div 
              className="p-4 rounded-lg text-sm mb-6"
              style={{ 
                background: 'rgba(239,68,68,0.08)', 
                border: '1px solid rgba(239,68,68,0.2)', 
                color: 'var(--status-error)',
                fontFamily: 'var(--font-body)' 
              }}
            >
              {error}
            </div>
          )}

          {/* Project cards — folk-style clean cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.length === 0 ? (
              <Link
                href="/projects/new"
                className="col-span-full group flex flex-col items-center justify-center py-16 rounded-xl border border-dashed transition-all hover:border-border-default"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <Sparkles size={24} className="mb-3" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                  start your first research project
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
                  click here or use the button above
                </p>
              </Link>
            ) : (
              projects.map((project) => (
                <Link 
                  key={project.id} 
                  href={`/${project.id}`}
                  className="group relative p-5 rounded-xl transition-all duration-200 hover:scale-[1.015]"
                  style={{ 
                    background: 'var(--bg-surface)', 
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {/* Project initial */}
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-4 transition-colors"
                    style={{ 
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span className="text-base font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                      {project.name.charAt(0).toLowerCase()}
                    </span>
                  </div>

                  <h3 
                    className="text-base font-medium truncate mb-1"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
                  >
                    {project.name}
                  </h3>
                  <p 
                    className="text-xs"
                    style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
                  >
                    {new Date(project.updatedAt).toLocaleDateString(undefined, { 
                      month: 'long', day: 'numeric', year: 'numeric' 
                    })}
                  </p>

                  {/* Hover arrow */}
                  <ArrowRight 
                    size={16} 
                    className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
