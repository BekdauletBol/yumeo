'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Plus, Menu, Command, ArrowUpRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Project } from '@/lib/types';
import { GlobalSidebar } from '@/components/ui/GlobalSidebar';

export function DashboardView() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex h-screen bg-black text-text-primary selection:bg-accent-primary/20">
      <GlobalSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <main className="flex-1 overflow-y-auto flex flex-col w-full relative scrollbar-thin">
        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-6 md:px-10 sticky top-0 bg-black/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-6">
            <button 
              className="md:hidden p-2 -ml-2 rounded-full hover:bg-bg-surface transition-colors text-text-secondary"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono font-bold text-text-secondary uppercase tracking-widest">
              <Command size={12} />
              <span>DASHBOARD</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        <div className="flex-1 px-6 md:px-10 pb-20 max-w-7xl mx-auto w-full">
          {/* Header Area */}
          <div className="pt-12 pb-12">
            <h1 className="text-3xl font-mono font-bold tracking-tight mb-2 uppercase">Welcome, {user.firstName || 'Researcher'}.</h1>
            {/* Stats Row - Subtle text only as requested */}
            <div className="flex gap-8 mt-4 text-[11px] font-mono text-text-secondary uppercase tracking-widest">
              <div>Projects / {projects.length}</div>
              <div>Materials / 0</div>
              <div>Active Chats / 7</div>
            </div>
          </div>

          {/* Project Grid */}
          <div className="space-y-10">
            <div className="flex items-end justify-between px-2">
              <h2 className="text-sm font-mono font-bold text-text-secondary uppercase tracking-widest">Recent Workspace</h2>
              <Link href="/projects/new" className="px-5 py-2.5 bg-accent-primary text-white text-xs font-bold rounded-xl transition-all hover:opacity-90 flex items-center gap-2 text-center">
                <Plus size={14} /> NEW PROJECT
              </Link>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-status-error/10 border border-status-error/20 text-status-error text-xs font-mono">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.length === 0 ? (
                <div className="col-span-full py-20 text-center border border-dashed border-border-subtle rounded-2xl">
                  <p className="text-text-secondary text-sm font-mono uppercase tracking-widest">No active workspaces</p>
                </div>
              ) : (
                projects.map((project) => (
                  <Link 
                    key={project.id} 
                    href={`/${project.id}`}
                    className="group bg-[#111111] border border-border-subtle p-6 rounded-2xl transition-all duration-200 hover:scale-[1.02] hover:border-border-default shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center text-text-secondary group-hover:text-accent-primary transition-colors">
                        <span className="font-mono text-lg font-bold">{project.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <ArrowUpRight size={18} className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <h4 className="font-mono font-bold text-text-primary text-lg truncate mb-1 uppercase tracking-tight">{project.name}</h4>
                    <p className="text-[10px] text-text-secondary font-mono uppercase tracking-widest">
                      {new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
