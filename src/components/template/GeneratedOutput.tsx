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

import type { ReportValidationResult } from '@/lib/types';

interface GeneratedOutputProps {
  content: string;
  templateName: string;
  isStreaming?: boolean;
  validation?: ReportValidationResult | null;
  bibliography?: string[];
}

/**
 * Displays AI-generated template output.
 * - Streaming: shows live text with blinking cursor
 * - Done: shows formatted content with export controls
 */
export function GeneratedOutput({
  content,
  templateName,
  isStreaming = false,
  validation,
  bibliography,
}: GeneratedOutputProps) {
  const hasUnverified = validation?.hasUnverified ?? false;

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
          <ExportMenu
            content={content}
            templateName={templateName}
            disabled={hasUnverified}
          />
        )}
      </div>

      {validation && !isStreaming && (
        <div
          className="mb-2 rounded-lg px-2 py-1 text-xs"
          style={{
            border: '1px solid var(--border-subtle)',
            background: hasUnverified ? 'rgba(250, 82, 82, 0.08)' : 'rgba(64, 192, 87, 0.08)',
            color: hasUnverified ? 'var(--status-error)' : 'var(--status-success)',
          }}
        >
          {hasUnverified
            ? 'Validation failed. Resolve citations before exporting.'
            : 'Validation passed. Export is enabled.'}
        </div>
      )}

      {validation && hasUnverified && !isStreaming && (
        <div
          className="mb-3 rounded-lg px-2 py-2 text-xs space-y-1"
          style={{
            border: '1px solid var(--border-subtle)',
            background: 'rgba(250, 82, 82, 0.06)',
            color: 'var(--text-secondary)',
          }}
        >
          {validation.invalidRefs.length > 0 && (
            <p>
              Invalid refs: {validation.invalidRefs.join(', ')}
            </p>
          )}
          {validation.missingCitations.length > 0 && (
            <p>
              Missing citations: {validation.missingCitations.length} sentence(s)
            </p>
          )}
          {validation.phantomAuthors.length > 0 && (
            <p>
              Phantom authors: {validation.phantomAuthors.map((p) => `${p.author} (${p.ref})`).join(', ')}
            </p>
          )}
        </div>
      )}

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

      {bibliography && bibliography.length > 0 && !isStreaming && (
        <div className="mt-3">
          <p className="text-section-label" style={{ color: 'var(--accent-template)' }}>References</p>
          <ul
            className="mt-2 text-xs space-y-1"
            style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
          >
            {bibliography.map((ref) => (
              <li key={ref}>{ref}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Export Menu ──────────────────────────────────────────────────────────────

interface ExportMenuProps {
  content: string;
  templateName: string;
  disabled?: boolean;
}

function ExportMenu({ content, templateName, disabled = false }: ExportMenuProps) {
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
    if (disabled) return;
    const md = exportAsMarkdown(content, templateName);
    const blob = new Blob([md], { type: 'text/markdown' });
    downloadBlob(blob, `${safeName}.md`);
  }, [content, templateName, safeName, disabled]);

  const handleExportDocx = useCallback(async () => {
    if (disabled) return;
    setIsExporting(true);
    try {
      const blob = await exportAsDocx(content, templateName);
      downloadBlob(blob, `${safeName}.docx`);
    } finally {
      setIsExporting(false);
    }
  }, [content, templateName, safeName, disabled]);

  const handleExportTex = useCallback(() => {
    if (disabled) return;
    const tex = exportAsLatex(content, templateName);
    const blob = new Blob([tex], { type: 'text/plain' });
    downloadBlob(blob, `${safeName}.tex`);
  }, [content, templateName, safeName, disabled]);

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
      <ExportButton onClick={handleExportMd} label="Export .md" disabled={disabled} />

      {/* Export .docx */}
      <ExportButton
        onClick={() => void handleExportDocx()}
        label={isExporting ? 'Exporting…' : 'Export .docx'}
        disabled={isExporting || disabled}
      />

      {/* Export .tex */}
      <ExportButton onClick={handleExportTex} label="Export .tex" disabled={disabled} />
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