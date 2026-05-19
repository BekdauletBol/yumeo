'use client';

import { useEffect } from 'react';
import { useReportEditorStore } from '@/stores/reportEditorStore';
import { TiptapEditor } from './TiptapEditor';
import { Plus, Trash2, ChevronLeft, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import { useReportAutoSave } from '@/hooks/useReportAutoSave';
import { useProjectStore } from '@/stores/projectStore';
import { useMaterialsStore } from '@/stores/materialsStore';

export function YuportEditor() {
  const { 
    pages, 
    activePageIndex, 
    initialTitle, 
    title,
    setTitle,
    draftId,
    updatePage, 
    addPage, 
    removePage, 
    setActivePage,
    setPages
  } = useReportEditorStore();

  const activeProject = useProjectStore((s) => s.activeProject);
  const materials = useMaterialsStore((s) => s.materials);
  const updateMaterial = useMaterialsStore((s) => s.updateMaterial);

  const draft = draftId ? materials.find((m) => m.id === draftId) : null;

  // Sync draft content to pages when draftId changes
  useEffect(() => {
    if (draft) {
      const content = draft.content;
      const splitPages = content.includes('<!-- PAGE_BREAK -->') 
        ? content.split('<!-- PAGE_BREAK -->') 
        : [content];
      setPages(splitPages.length > 0 ? splitPages : ['']);
      setTitle(draft.name);
    }
  }, [draftId, draft, setPages, setTitle]);

  // Unified content for auto-save (combine pages with logical markers)
  const fullContent = pages.join('<!-- PAGE_BREAK -->');

  const { isSaved } = useReportAutoSave({
    projectId: activeProject?.id,
    draftId,
    title,
    content: fullContent,
    onSave: async (updatedContent) => {
      if (draftId) {
        const existing = materials.find((m) => m.id === draftId);
        if (existing) updateMaterial({ ...existing, content: updatedContent });
      }
    },
  });

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
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#F0EDE8' }}>
      {/* Yuport Header */}
      <div className="h-14 border-b flex items-center justify-between px-6 shrink-0" style={{ borderColor: '#E8E3DD', background: '#FAF8F5' }}>
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl text-orange-600" style={{ background: 'rgba(232,97,26,0.08)' }}>
            <FileText size={18} />
          </div>
          <div className="flex flex-col">
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs font-bold uppercase tracking-widest truncate max-w-[200px] bg-transparent outline-none"
              style={{ color: '#1A1A1A', borderBottom: '1px solid transparent' }}
              onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#E8611A'; }}
              onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'transparent'; }}
            />
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-mono" style={{ color: '#8A8A8A' }}>
                PAGE {activePageIndex + 1} OF {pages.length}
              </p>
              {isSaved ? (
                <span className="text-[9px] font-mono font-bold uppercase flex items-center gap-1" style={{ color: '#10b981' }}>
                  <CheckCircle2 size={10} /> Saved
                </span>
              ) : (
                <span className="text-[9px] font-mono font-bold uppercase flex items-center gap-1" style={{ color: '#8A8A8A' }}>
                  <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" /> Saving
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => addPage(activePageIndex)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all hover:border-orange-500"
            style={{ background: '#FAF8F5', border: '1px solid #E8E3DD', color: '#4A4A4A' }}
          >
            <Plus size={14} /> New Page
          </button>
        </div>
      </div>

      {/* A4 Page Scroll Area — warm cream canvas */}
      <div className="flex-1 overflow-y-auto py-10 px-6 scrollbar-thin" style={{ background: '#F0EDE8' }}>
        <div className="max-w-[880px] mx-auto space-y-10">
          {pages.map((content, idx) => (
            <div 
              key={idx} 
              className="transition-all duration-500"
              style={{ opacity: activePageIndex === idx ? 1 : 0.45 }}
              onClick={() => setActivePage(idx)}
            >
              <TiptapEditor 
                initialContent={content}
                isActive={activePageIndex === idx}
                onChange={(newHtml) => handlePageUpdate(idx, newHtml)}
                placeholder={`Page ${idx + 1}: Write your research here…`}
              />
              
              {/* Page Actions */}
              <div className="mt-3 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-mono font-bold" style={{ color: '#B8B0A5' }}>PAGE {idx + 1}</span>
                   {pages.length > 1 && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); removePage(idx); }}
                       className="p-1.5 rounded-lg transition-colors hover:bg-red-100"
                       style={{ color: '#B8B0A5' }}
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
                      className="p-1.5 rounded hover:bg-stone-200 disabled:opacity-20 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      disabled={idx === pages.length - 1}
                      onClick={() => setActivePage(idx + 1)}
                      className="p-1.5 rounded hover:bg-stone-200 disabled:opacity-20 transition-colors"
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
            className="w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group"
            style={{
              borderColor: '#D5CFC8',
              color: '#B8B0A5',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#E8611A';
              e.currentTarget.style.color = '#E8611A';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#D5CFC8';
              e.currentTarget.style.color = '#B8B0A5';
            }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all" style={{ background: '#EDE9E4' }}>
              <Plus size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Append New Page</span>
          </button>
        </div>
      </div>

      {/* Keyboard Hint Footer */}
      <div className="h-10 border-t flex items-center justify-center gap-8 shrink-0" style={{ borderColor: '#E8E3DD', background: '#FAF8F5' }}>
        <div className="flex items-center gap-2 text-[9px] font-mono font-bold" style={{ color: '#8A8A8A' }}>
          <kbd className="px-1.5 py-0.5 rounded" style={{ background: '#EDE9E4', border: '1px solid #D5CFC8', color: '#4A4A4A' }}>CMD + K</kbd>
          <span>AI EDIT</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono font-bold" style={{ color: '#8A8A8A' }}>
          <kbd className="px-1.5 py-0.5 rounded" style={{ background: '#EDE9E4', border: '1px solid #D5CFC8', color: '#4A4A4A' }}>TAB</kbd>
          <span>ACCEPT GHOST TEXT</span>
        </div>
      </div>
    </div>
  );
}
