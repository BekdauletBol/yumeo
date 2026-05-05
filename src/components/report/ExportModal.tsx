'use client';

import { useState } from 'react';
import { X, FileText, Printer, Loader2 } from 'lucide-react';
import { exportToDOCX, exportToPDF } from '@/hooks/useReportExport';

interface ExportModalProps {
  title: string;
  content: string;
  onClose: () => void;
}

/**
 * Format picker modal shown when user clicks Export.
 * Offers DOCX (Word) and PDF (browser print) options.
 */
export function ExportModal({ title, content, onClose }: ExportModalProps) {
  const [loading, setLoading] = useState<'docx' | 'pdf' | null>(null);

  const handle = async (format: 'docx' | 'pdf') => {
    setLoading(format);
    try {
      if (format === 'docx') {
        await exportToDOCX({ title, content });
      } else {
        await exportToPDF({ title, content });
      }
      onClose();
    } catch {
      alert(`Export failed. Please try again.`);
    } finally {
      setLoading(null);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            >
              Export your report
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Choose a format to download
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
            aria-label="Close export modal"
          >
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          {/* DOCX */}
          <button
            onClick={() => void handle('docx')}
            disabled={loading !== null}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-all disabled:opacity-50"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
            }}
            aria-label="Download as DOCX"
          >
            <div
              className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(37,99,235,0.12)' }}
            >
              {loading === 'docx' ? (
                <Loader2 size={20} className="animate-spin" style={{ color: '#3b82f6' }} />
              ) : (
                <FileText size={20} style={{ color: '#3b82f6' }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                📄 Download as DOCX
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Word document · Times New Roman 12pt · 1-inch margins
              </p>
            </div>
          </button>

          {/* PDF */}
          <button
            onClick={() => void handle('pdf')}
            disabled={loading !== null}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-all disabled:opacity-50"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
            }}
            aria-label="Download as PDF"
          >
            <div
              className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.1)' }}
            >
              {loading === 'pdf' ? (
                <Loader2 size={20} className="animate-spin" style={{ color: '#ef4444' }} />
              ) : (
                <Printer size={20} style={{ color: '#ef4444' }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                📋 Download as PDF
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Browser print dialog · Select &ldquo;Save as PDF&rdquo;
              </p>
            </div>
          </button>
        </div>

        {/* Footer note */}
        <div
          className="px-6 pb-5 text-xs text-center"
          style={{ color: 'var(--text-tertiary)' }}
        >
          AI preamble is automatically stripped before export.
        </div>
      </div>
    </div>
  );
}
