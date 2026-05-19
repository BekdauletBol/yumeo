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
    close,
  } = useReportEditorStore();

  const [showExportModal, setShowExportModal] = useState(false);
  const { title, pages } = useReportEditorStore();
  const fullContent = pages.join('<!-- PAGE_BREAK -->');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-bg-base animate-in fade-in duration-300"
    >
      {/* ── Close Button (floating/overlay for mobile modal) ── */}
      <button
        onClick={close}
        className="absolute top-4 right-4 z-[110] p-2 rounded-xl bg-bg-elevated/50 backdrop-blur-md border border-border-subtle hover:bg-red-500/10 hover:text-red-500 transition-all"
      >
        <X size={20} />
      </button>

      {/* ── Export Button (floating/overlay) ── */}
      <button
        onClick={() => setShowExportModal(true)}
        className="absolute top-4 right-16 z-[110] p-2 rounded-xl bg-bg-elevated/50 backdrop-blur-md border border-border-subtle hover:border-accent-primary transition-all text-text-secondary"
      >
        <Download size={20} />
      </button>

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
