'use client';

import { useReportEditorStore } from '@/stores/reportEditorStore';
import { TiptapEditor } from './TiptapEditor';
import { cn } from '@/lib/utils/cn';
import { Plus, Trash2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

export function YuportEditor() {
  const { 
    pages, 
    activePageIndex, 
    initialTitle, 
    updatePage, 
    addPage, 
    removePage, 
    setActivePage,
    setPages
  } = useReportEditorStore();

  const handlePageUpdate = (idx: number, newHtml: string) => {
    // Check for AI-triggered page break
    if (newHtml.includes('<!-- PAGE_BREAK -->')) {
      const split = newHtml.split('<!-- PAGE_BREAK -->');
      const newPages = [...pages];
      newPages[idx] = split[0] || '';
      
      // Insert subsequent parts as new pages
      for (let i = 1; i < split.length; i++) {
        newPages.splice(idx + i, 0, split[i] || '');
      }
      
      setPages(newPages);
      setActivePage(idx + 1); // Move to the newly created page
    } else {
      updatePage(idx, newHtml);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-base overflow-hidden">
      {/* Yuport Header */}
      <div className="h-14 border-b border-border-subtle bg-bg-surface flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-primary truncate max-w-[200px]">
              {initialTitle}
            </h2>
            <p className="text-[10px] font-mono text-text-tertiary">
              PAGE {activePageIndex + 1} OF {pages.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => addPage(activePageIndex)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-[10px] font-bold uppercase tracking-tight hover:border-accent-primary transition-all"
          >
            <Plus size={14} /> New Page
          </button>
        </div>
      </div>

      {/* Paginated Content Area — darker bg so A4 sheets "float" */}
      <div className="flex-1 overflow-y-auto overflow-x-auto p-8 md:p-12 scrollbar-thin" style={{ background: 'var(--bg-base)' }}>
        <div className="mx-auto space-y-12" style={{ maxWidth: '860px' }}>
          {pages.map((content, idx) => (
            <div 
              key={idx} 
              className={cn(
                "transition-all duration-500",
                activePageIndex === idx ? "opacity-100 scale-100" : "opacity-40 scale-[0.98] pointer-events-none"
              )}
              onClick={() => setActivePage(idx)}
            >
              <TiptapEditor 
                initialContent={content}
                isActive={activePageIndex === idx}
                onChange={(newHtml) => handlePageUpdate(idx, newHtml)}
                placeholder={`Page ${idx + 1}: Write your research here...`}
              />
              
              {/* Page Actions */}
              <div className="mt-4 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-mono font-bold text-text-tertiary">PAGE {idx + 1}</span>
                   {pages.length > 1 && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); removePage(idx); }}
                       className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-text-tertiary transition-colors"
                     >
                       <Trash2 size={14} />
                     </button>
                   )}
                </div>
                
                {activePageIndex === idx && (
                  <div className="flex items-center gap-1">
                    <button 
                      disabled={idx === 0}
                      onClick={() => setActivePage(idx - 1)}
                      className="p-1.5 rounded hover:bg-bg-elevated disabled:opacity-20"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      disabled={idx === pages.length - 1}
                      onClick={() => setActivePage(idx + 1)}
                      className="p-1.5 rounded hover:bg-bg-elevated disabled:opacity-20"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => addPage()}
            className="w-full py-8 border-2 border-dashed border-border-subtle rounded-2xl flex flex-col items-center justify-center gap-3 text-text-tertiary hover:border-accent-primary hover:text-accent-primary transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center group-hover:bg-accent-primary/10 transition-all">
              <Plus size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Append New Page</span>
          </button>
        </div>
      </div>

      {/* Keyboard Hint Footer */}
      <div className="h-10 border-t border-border-subtle bg-bg-surface flex items-center justify-center gap-8 shrink-0">
        <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-text-tertiary">
          <kbd className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border-subtle text-text-secondary">CMD + K</kbd>
          <span>AI EDIT</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-text-tertiary">
          <kbd className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border-subtle text-text-secondary">TAB</kbd>
          <span>ACCEPT GHOST TEXT</span>
        </div>
      </div>
    </div>
  );
}
