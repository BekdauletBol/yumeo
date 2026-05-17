'use client';

import { useEffect, useState } from 'react';
import { X, Download, Wand2, Save, FileText, CheckCircle2 } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useReportEditorStore } from '@/stores/reportEditorStore';
import { useReportAutoSave } from '@/hooks/useReportAutoSave';
import { YuportEditor } from '@/components/editor/YuportEditor';
import { ExportModal } from './ExportModal';
import { cn } from '@/lib/utils/cn';
import { nanoid } from 'nanoid';

/**
 * Full-screen report editor modal featuring the paginated Yuport Tiptap editor.
 * Includes AI writing assistant, multi-page support, and grounded citations.
 */
export function ReportEditorModal() {
  const { 
    isOpen, 
    pages, 
    initialTitle, 
    draftId, 
    close,
    activePageIndex
  } = useReportEditorStore();

  const activeProject = useProjectStore((s) => s.activeProject);
  const materials = useMaterialsStore((s) => s.materials);
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const updateMaterial = useMaterialsStore((s) => s.updateMaterial);

  const draft = draftId ? materials.find((m) => m.id === draftId) : null;

  const [title, setTitle] = useState(initialTitle);
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>(draftId);
  const [showExportModal, setShowExportModal] = useState(false);

  // Sync title and draft ID when modal opens or draft changes
  useEffect(() => {
    if (!isOpen) return;
    if (draft) {
      setTitle(draft.name);
      setActiveDraftId(draft.id);
    } else {
      setTitle(initialTitle);
      setActiveDraftId(undefined);
    }
  }, [isOpen, initialTitle, draft]);

  // Unified content for auto-save (combine pages with logical markers)
  const fullContent = pages.join('<!-- PAGE_BREAK -->');

  // Auto-save logic
  const { isSaved } = useReportAutoSave({
    projectId: activeProject?.id,
    draftId: activeDraftId,
    title,
    content: fullContent,
    onSave: async (updatedContent) => {
      if (activeDraftId) {
        const existing = materials.find((m) => m.id === activeDraftId);
        if (existing) updateMaterial({ ...existing, content: updatedContent });
      }
    },
  });

  const handleManualSave = () => {
    if (!activeProject || activeDraftId) return;
    const id = nanoid();
    addMaterial({
      id,
      projectId: activeProject.id,
      section: 'drafts',
      name: title,
      content: fullContent,
      metadata: { fileType: 'html', fileSize: new Blob([fullContent]).size },
      createdAt: new Date(),
    });
    setActiveDraftId(id);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-bg-base animate-in fade-in duration-300"
    >
      {/* ── Top Navigation Bar ── */}
      <div className="h-14 border-b border-border-subtle bg-bg-surface flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-accent-primary flex items-center justify-center text-white shadow-lg shadow-accent-primary/20">
               <FileText size={18} />
             </div>
             <input
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               className="bg-transparent text-sm font-bold outline-none border-b border-transparent focus:border-accent-primary transition-all py-1 min-w-[200px]"
               placeholder="Report Title..."
             />
          </div>

          <div className="h-4 w-px bg-border-subtle" />

          <div className="flex items-center gap-4">
            {isSaved ? (
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-status-success uppercase tracking-tighter">
                <CheckCircle2 size={12} />
                Synced to Cloud
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-text-tertiary uppercase tracking-tighter">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                Saving Changes...
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!activeDraftId && (
            <button
              onClick={handleManualSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-xs font-bold uppercase tracking-widest hover:border-accent-primary transition-all"
            >
              <Save size={14} /> Save Draft
            </button>
          )}
          
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-xs font-bold uppercase tracking-widest hover:border-accent-primary transition-all"
          >
            <Download size={14} /> Export
          </button>

          <button
            onClick={close}
            className="p-2 rounded-xl bg-bg-elevated border border-border-subtle hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ── Main Yuport Editor ── */}
      <div className="flex-1 overflow-hidden relative">
        <YuportEditor />
      </div>

      {/* ── Secondary Modals ── */}
      {showExportModal && (
        <ExportModal
          title={title}
          content={fullContent}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
