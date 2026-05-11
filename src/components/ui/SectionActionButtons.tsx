'use client';

import { Plus, Download, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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
  const btnClass = "p-1.5 rounded-lg transition-all text-text-tertiary hover:text-text-primary hover:bg-bg-elevated border border-transparent hover:border-border-subtle";

  return (
    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
      {showAddToReport && onAddToReport && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToReport();
          }}
          className={btnClass}
          title="Add to report"
        >
          <Plus size={14} />
        </button>
      )}

      {showDownload && onDownload && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className={btnClass}
          title="Download"
        >
          <Download size={14} />
        </button>
      )}

      {showCopy && onCopy && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className={btnClass}
          title="Copy"
        >
          <Copy size={14} />
        </button>
      )}

      {showDelete && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={cn(btnClass, "hover:text-status-error")}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
