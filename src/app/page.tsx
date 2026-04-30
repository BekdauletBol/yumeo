'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, BarChart3, MessageSquare, HardDrive, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Project } from '@/lib/types';
import { GlobalSidebar } from '@/components/ui/GlobalSidebar';

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // Fetch projects (simulated API fetch, normally you'd use a tRPC/SWR hook or server actions passed as props)
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects'); // or however you fetch client side
        if (response.ok) {
           const data = await response.json();
           setProjects(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchProjects();
  }, [user]);

  if (!isLoaded || !user) return null;

  return (
    <div className="flex h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <GlobalSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <main className="flex-1 overflow-y-auto flex flex-col w-full">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
            {/* Mobile Hamburger Menu */}
            <button 
              className="md:hidden p-2 rounded-md hover:bg-[var(--bg-elevated)] transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="hidden sm:inline">Command Menu <kbd className="hidden sm:inline-block ml-1 px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs">⌘K</kbd></span>
          </div>
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-semibold mb-1 tracking-tight">Dashboard</h1>
              <p className="text-[var(--text-secondary)] text-sm">Welcome back</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1 font-mono">Pro Plan</p>
              <p className="text-sm font-medium">Unlimited access</p>
            </div>
          </div>

          {/* Stats Row */}
          {/* Added md:grid-cols-3 to stack stats on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Projects Created</span>
                <HardDrive size={16} className="text-[var(--text-tertiary)]" />
              </div>
              <div className="text-3xl font-semibold">{projects.length}</div>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Total active projects</p>
            </div>
            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Materials Processed</span>
                <BarChart3 size={16} className="text-[var(--text-tertiary)]" />
              </div>
              <div className="text-3xl font-semibold">0</div>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">This month</p>
            </div>
            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Active Chats</span>
                <MessageSquare size={16} className="text-[var(--text-tertiary)]" />
              </div>
              <div className="text-3xl font-semibold">7</div>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Ongoing sessions</p>
            </div>
          </div>

          {/* Recent Activity / Projects */}
          <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium">Recent Activity (Projects)</h2>
              <Link href="/projects/new" className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--text-primary)] text-[var(--bg-base)] text-xs font-medium rounded-md hover:opacity-90 transition-opacity">
                <Plus size={14} /> <span className="hidden sm:inline">New Project</span>
              </Link>
            </div>
            
            <div className="divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)] -mx-6 px-6">
              {projects.length === 0 ? (
                 <div className="py-8 text-center text-[var(--text-tertiary)] text-sm">No projects found. Create one to get started!</div>
              ) : (
                projects.map(project => (
                  <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 group gap-3">
                    <div className="flex flex-col">
                      <Link href={`/${project.id}`} className="text-sm font-medium hover:underline text-[var(--text-primary)] max-w-xs truncate">
                        {project.name}
                      </Link>
                      <span className="text-xs text-[var(--text-tertiary)] mt-1 max-w-xs truncate">{project.description || 'No description provided'}</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      <span className="text-xs font-mono text-[var(--text-tertiary)]">{new Date(project.updatedAt).toLocaleDateString()}</span>
                      <Link href={`/${project.id}`} className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                        Open
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
