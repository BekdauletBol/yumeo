'use client';

import { DownloadIcon, Zap } from 'lucide-react';

interface ReportToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  onAISidebarToggle: () => void;
  onExport: () => void;
}

export function ReportToolbar({
  title,
  onTitleChange,
  onAISidebarToggle,
  onExport,
}: ReportToolbarProps) {
  return (
    <div className="border-b p-4 space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Enter report title..."
        className="w-full px-3 py-2 rounded text-lg font-semibold border focus:outline-none focus:ring-2"
        style={{
          borderColor: 'var(--border-default)',
          color: 'var(--text-primary)',
          backgroundColor: 'var(--bg-base)',
          '--tw-ring-color': 'var(--accent-primary)',
        } as React.CSSProperties}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {/* Format Buttons */}
          <button
            className="px-2 py-1 rounded text-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Heading 1"
          >
            H1
          </button>
          <button
            className="px-2 py-1 rounded text-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Heading 2"
          >
            H2
          </button>
          <button
            className="px-2 py-1 rounded text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Bold"
          >
            B
          </button>
          <button
            className="px-2 py-1 rounded text-sm italic hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Italic"
          >
            I
          </button>
          <button
            className="px-2 py-1 rounded text-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Bullet List"
          >
            •
          </button>
          <button
            className="px-2 py-1 rounded text-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Numbered List"
          >
            1.
          </button>
        </div>

        <div className="flex-1" /> {/* Spacer */}

        {/* Action Buttons */}
        <button
          onClick={onAISidebarToggle}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
          }}
        >
          <Zap size={16} />
          Ask Yumeo
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors hover:opacity-80"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <DownloadIcon size={16} />
          Export
        </button>
      </div>
    </div>
  );
}
