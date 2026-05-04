'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { ReportToolbar } from './ReportToolbar';
import { ReportDocument } from './ReportDocument';
import { ReportAISidebar } from './ReportAISidebar';
import { useReportAutoSave } from '@/hooks/useReportAutoSave';

interface ReportEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftId?: string;
}

export function ReportEditorModal({ isOpen, onClose, draftId }: ReportEditorModalProps) {
  const activeProject = useProjectStore((s) => s.activeProject);
  const materials = useMaterialsStore((s) => s.materials);
  const updateMaterial = useMaterialsStore((s) => s.updateMaterial);
  
  const [title, setTitle] = useState('Untitled Report');
  const [content, setContent] = useState('');
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const draft = draftId ? materials.find(m => m.id === draftId) : null;
  
  useEffect(() => {
    if (draft) {
      setTitle(draft.name);
      setContent(draft.content || '');
    }
  }, [draft]);

  const { isSaved } = useReportAutoSave({
    projectId: activeProject?.id,
    draftId: draftId,
    title,
    content,
    onSave: async (updatedContent) => {
      if (draft) {
        const updated = { ...draft, content: updatedContent };
        updateMaterial(updated);
      }
      setContent(updatedContent);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full h-full max-w-7xl max-h-screen flex flex-col rounded-lg overflow-hidden" 
        style={{ background: 'var(--bg-surface)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Report Editor</h2>
          <div className="flex items-center gap-3">
            {!isSaved && <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Saving...</span>}
            {isSaved && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Saved</span>}
            <button
              onClick={onClose}
              className="p-1 hover:bg-red-500/10 rounded transition-colors"
            >
              <X size={20} style={{ color: 'var(--text-primary)' }} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Document Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ReportToolbar
              title={title}
              onTitleChange={setTitle}
              onAISidebarToggle={() => setShowAISidebar(!showAISidebar)}
              onExport={() => {
                // Export handler (DOCX/PDF)
                console.log('Export:', { title, content });
              }}
            />
            <div className="flex-1 overflow-y-auto">
              <ReportDocument
                title={title}
                content={content}
                onContentChange={setContent}
                onCursorChange={setCursorPosition}
              />
            </div>
          </div>

          {/* AI Sidebar */}
          {showAISidebar && (
            <ReportAISidebar
              projectId={activeProject?.id}
              cursorPosition={cursorPosition}
              onInsertContent={(text) => {
                setContent(prev => {
                  const before = prev.substring(0, cursorPosition);
                  const after = prev.substring(cursorPosition);
                  return before + text + after;
                });
              }}
              onClose={() => setShowAISidebar(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
