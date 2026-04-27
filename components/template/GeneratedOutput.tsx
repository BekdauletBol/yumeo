'use client';

import { useCallback } from 'react';
import { Download, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import {
  exportAsMarkdown,
  exportAsDocx,
  exportAsLatex,
  downloadBlob,
} from '@/lib/utils/exporters';
import { cn } from '@/lib/utils/cn';

interface GeneratedOutputProps {
  content: string;
  templateName: string;
  isStreaming?: boolean;
}

/**
 * Displays AI-generated template output.
 * - Streaming: shows live text with blinking cursor
 * - Done: shows formatted content with export controls
 */
export function GeneratedOutput({ content, templateName, isStreaming = false }: GeneratedOutputProps) {
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-section-label" style={{ color: 'var(--accent-template)' }}>
          Generated Output
          {isStreaming && (
            <span className="ml-2 text-xs" style={{ color: 'var(--text-tertiary)', textTransform: 'none', letterSpacing: 0 }}>
              writing…
            </span>
          )}
        </p>
        {!isStreaming && content && (
          <ExportMenu content={content} templateName={templateName} />
        )}
      </div>

      {/* Content */}
      <div
        className={cn('text-xs leading-relaxed rounded-lg p-3 max-h-96 overflow-y-auto', isStreaming && 'streaming-cursor')}
        style={{
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          border: '1px solid var(--border-subtle)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content || <span style={{ color: 'var(--text-tertiary)' }}>Generating…</span>}
      </div>
    </div>
  );
}

// ─── Export Menu ──────────────────────────────────────────────────────────────

interface ExportMenuProps {
  content: string;
  templateName: string;
}

function ExportMenu({ content, templateName }: ExportMenuProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const safeName = templateName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }, [content]);

  const handleExportMd = useCallback(() => {
    const md = exportAsMarkdown(content, templateName);
    const blob = new Blob([md], { type: 'text/markdown' });
    downloadBlob(blob, `${safeName}.md`);
  }, [content, templateName, safeName]);

  const handleExportDocx = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await exportAsDocx(content, templateName);
      downloadBlob(blob, `${safeName}.docx`);
    } finally {
      setIsExporting(false);
    }
  }, [content, templateName, safeName]);

  const handleExportTex = useCallback(() => {
    const tex = exportAsLatex(content, templateName);
    const blob = new Blob([tex], { type: 'text/plain' });
    downloadBlob(blob, `${safeName}.tex`);
  }, [content, templateName, safeName]);

  return (
    <div className="flex items-center gap-1">
      {/* Copy */}
      <button
        onClick={() => void handleCopy()}
        aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
        style={{ color: copied ? 'var(--status-success)' : 'var(--text-tertiary)', background: 'var(--bg-overlay)' }}
      >
        {copied ? <CheckCircle2 size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
        {copied ? 'Copied' : 'Copy'}
      </button>

      {/* Export .md */}
      <ExportButton onClick={handleExportMd} label="Export .md" />

      {/* Export .docx */}
      <ExportButton
        onClick={() => void handleExportDocx()}
        label={isExporting ? 'Exporting…' : 'Export .docx'}
        disabled={isExporting}
      />

      {/* Export .tex */}
      <ExportButton onClick={handleExportTex} label="Export .tex" />
    </div>
  );
}

interface ExportButtonProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}

function ExportButton({ onClick, label, disabled }: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80 disabled:opacity-40"
      style={{ color: 'var(--text-secondary)', background: 'var(--bg-overlay)' }}
    >
      <Download size={11} aria-hidden="true" />
      {label}
    </button>
  );
}