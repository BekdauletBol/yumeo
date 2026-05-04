'use client';

import { MessageCircle, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';

interface ReportInlinePopupProps {
  selectedText: string;
  position: { top: number; left: number };
  onClose: () => void;
  onAskYumeo: () => void;
  onRewrite: () => void;
  onExpand: () => void;
  onDelete: () => void;
}

export function ReportInlinePopup({
  selectedText,
  position,
  onClose,
  onAskYumeo,
  onRewrite,
  onExpand,
  onDelete,
}: ReportInlinePopupProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const popup = document.getElementById('report-inline-popup');
      if (popup && !popup.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      id="report-inline-popup"
      className="fixed z-50 animate-fade-in"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div
        className="flex items-center gap-1 p-2 rounded-lg shadow-lg border backdrop-blur-sm"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
      >
        <button
          onClick={onAskYumeo}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-900"
          style={{ color: 'var(--text-primary)' }}
          title="Ask Yumeo about this text"
        >
          <MessageCircle size={14} />
          <span>Ask</span>
        </button>

        <button
          onClick={onRewrite}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-900"
          style={{ color: 'var(--text-primary)' }}
          title="Rewrite this text"
        >
          <RefreshCw size={14} />
          <span>Rewrite</span>
        </button>

        <button
          onClick={onExpand}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-900"
          style={{ color: 'var(--text-primary)' }}
          title="Expand this text"
        >
          <Plus size={14} />
          <span>Expand</span>
        </button>

        <div
          className="h-5 w-px"
          style={{ backgroundColor: 'var(--border-subtle)' }}
        />

        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all hover:bg-red-100 dark:hover:bg-red-900/30"
          style={{ color: 'var(--status-error)' }}
          title="Delete this text"
        >
          <Trash2 size={14} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
