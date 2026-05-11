'use client';

import { useProjectSectionsStore } from '@/stores/projectSectionsStore';
import { cn } from '@/lib/utils/cn';

export function EditorPanel() {
  const { activeSectionId, sections } = useProjectSectionsStore();
  const activeSection = sections.find(s => s.id === activeSectionId);

  return (
    <section className="ide-editor flex flex-col bg-black border-l border-border-subtle overflow-hidden">
      {/* Minimal Tabs */}
      <div className="h-12 flex items-center px-6 border-b border-border-subtle gap-8">
        <button className="text-[11px] font-mono font-bold text-text-primary uppercase tracking-widest border-b-2 border-accent-primary h-full px-2">
          {activeSection?.name || 'Context'}
        </button>
        <button className="text-[11px] font-mono font-bold text-text-tertiary hover:text-text-secondary transition-colors uppercase tracking-widest h-full px-2">
          History
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 scrollbar-thin">
        <div className="max-w-2xl mx-auto space-y-12">
          <div className="space-y-4">
            <h2 className="text-2xl font-mono font-bold text-text-primary uppercase tracking-tight">
              {activeSection?.name || 'No Section Selected'}
            </h2>
            <div className="h-px w-20 bg-accent-primary" />
          </div>

          <div className="bg-[#111111] border border-border-subtle rounded-2xl p-8 min-h-[400px] shadow-sm">
             <div className="prose prose-invert prose-sm max-w-none font-body text-text-secondary leading-relaxed">
               {activeSectionId ? (
                 <p>Select a material or start writing. Every sentence you type here is checked against your references in real-time.</p>
               ) : (
                 <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                   <div className="w-12 h-12 rounded-full border border-dashed border-border-subtle flex items-center justify-center text-text-tertiary">
                     ?
                   </div>
                   <p className="font-mono uppercase text-[10px] tracking-widest">Select a section to begin</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
