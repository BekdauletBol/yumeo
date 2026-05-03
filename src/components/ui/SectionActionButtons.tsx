'use client';

import { Plus, Download, Trash2, Copy } from 'lucide-react';

interface SectionActionButtonsProps {
  onAddToReport?: () => void;
  onDownload?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  showAddToReport?: boolean;
  showDownload?: boolean;
  showCopy?: boolean;
  showDelete?: boolean;
}

export function SectionActionButtons({
  onAddToReport,
  onDownload,
  onCopy,
  onDelete,
  showAddToReport = false,
  showDownload = false,
  showCopy = false,
  showDelete = false,
}: SectionActionButtonsProps) {
  return (
    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {showAddToReport && onAddToReport && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToReport();
          }}
          className="p-1 rounded hover:bg-white/10"
          style={{ color: 'var(--text-tertiary)' }}
          title="Add to report"
        >
          <Plus size={12} />
        </button>
      )}

      {showDownload && onDownload && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="p-1 rounded hover:bg-white/10"
          style={{ color: 'var(--text-tertiary)' }}
          title="Download"
        >
          <Download size={12} />
        </button>
      )}

      {showCopy && onCopy && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="p-1 rounded hover:bg-white/10"
          style={{ color: 'var(--text-tertiary)' }}
          title="Copy"
        >
          <Copy size={12} />
        </button>
      )}

      {showDelete && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-white/10"
          style={{ color: 'var(--text-tertiary)' }}
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}
