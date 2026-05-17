'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink, Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import * as pdfjs from 'pdfjs-dist';

// Set worker path
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export function CitationViewer() {
  const { citationViewer, closeCitationViewer } = useUIStore();
  const { materials } = useMaterialsStore();
  const [numPages, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const pdfRef = useRef<any>(null);

  const activeMaterial = materials.find(m => m.id === citationViewer.materialId);

  useEffect(() => {
    if (citationViewer.isOpen && citationViewer.pageNumber) {
      setCurrentPage(citationViewer.pageNumber);
    }
    setError(null);
  }, [citationViewer.isOpen, citationViewer.materialId, citationViewer.pageNumber]);

  useEffect(() => {
    if (!citationViewer.isOpen || !activeMaterial?.storageUrl) return;

    async function loadPdf() {
      try {
        setIsLoading(true);
        setError(null);
        
        const url = activeMaterial?.storageUrl;
        if (!url) throw new Error('No document URL available');

        const loadingTask = pdfjs.getDocument(url);
        const pdf = await loadingTask.promise;
        pdfRef.current = pdf;
        setPageCount(pdf.numPages);
        
        // Ensure currentPage is within bounds
        const targetPage = Math.min(Math.max(1, currentPage), pdf.numPages);
        if (targetPage !== currentPage) setCurrentPage(targetPage);
        
        await renderPage(pdf, targetPage);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    }

    loadPdf();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [citationViewer.isOpen, activeMaterial?.storageUrl, currentPage]);

  /**
   * Normalize text for fuzzy matching: lowercase, collapse whitespace, strip punctuation edges.
   */
  function normalizeText(t: string): string {
    return t.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /**
   * Build a single string from PDF text items and keep a mapping
   * of character-offset → item index so we can trace matches back.
   */
  function buildTextMap(items: any[]) {
    let full = '';
    const charToItem: { itemIdx: number; localOffset: number }[] = [];
    for (let i = 0; i < items.length; i++) {
      const str: string = items[i].str;
      for (let c = 0; c < str.length; c++) {
        charToItem.push({ itemIdx: i, localOffset: c });
      }
      full += str;
      // Add a space between items (PDF often separates words as items)
      charToItem.push({ itemIdx: i, localOffset: str.length });
      full += ' ';
    }
    return { full, charToItem };
  }

  async function renderPage(pdf: any, pageNum: number) {
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      // Calculate scale to fit container width
      const dpr = window.devicePixelRatio || 1;
      const containerWidth = containerRef.current?.clientWidth || 400;
      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = (containerWidth - 40) / unscaledViewport.width; // 40px padding
      
      const viewport = page.getViewport({ scale: Math.max(scale, 1.2) });
      
      canvas.height = viewport.height * dpr;
      canvas.width = viewport.width * dpr;
      canvas.style.height = `${viewport.height}px`;
      canvas.style.width = `${viewport.width}px`;

      context.scale(dpr, dpr);

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;

      // ── Highlight citation text on top of rendered page ──
      const highlightText = citationViewer.highlightedText;
      if (highlightText && highlightText.length > 10) {
        try {
          const textContent = await page.getTextContent();
          const items = textContent.items.filter((it: any) => typeof it.str === 'string' && it.str.length > 0);
          if (items.length === 0) return;

          const { full, charToItem } = buildTextMap(items);
          const normalizedFull = normalizeText(full);
          const normalizedQuery = normalizeText(highlightText);

          // Find match position in the concatenated text
          const matchStart = normalizedFull.indexOf(normalizedQuery);

          // Collect item indices that are part of the match
          const matchedItemIndices = new Set<number>();
          if (matchStart !== -1) {
            // Direct substring match — highlight all items that fall inside
            for (let ci = matchStart; ci < matchStart + normalizedQuery.length && ci < charToItem.length; ci++) {
              const entry = charToItem[ci];
              if (entry) matchedItemIndices.add(entry.itemIdx);
            }
          } else {
            // Fallback: match individual significant words (≥4 chars)
            const words = normalizedQuery.split(/\s+/).filter(w => w.length >= 4);
            for (const word of words) {
              let searchFrom = 0;
              while (true) {
                const pos = normalizedFull.indexOf(word, searchFrom);
                if (pos === -1) break;
                for (let ci = pos; ci < pos + word.length && ci < charToItem.length; ci++) {
                  const entry = charToItem[ci];
                  if (entry) matchedItemIndices.add(entry.itemIdx);
                }
                searchFrom = pos + word.length;
              }
            }
          }

          if (matchedItemIndices.size > 0) {
            // Draw highlights
            context.save();
            context.globalAlpha = 0.30;
            context.fillStyle = '#FACC15'; // Yellow-400
            context.globalCompositeOperation = 'multiply';

            for (const idx of matchedItemIndices) {
              const item = items[idx];
              const tx = item.transform; // [scaleX, skewX, skewY, scaleY, translateX, translateY]
              if (!tx) continue;

              // Convert PDF coordinates → viewport coordinates
              const [a, b, c, d, e, f] = tx;
              const fontSize = Math.sqrt(d * d + c * c);
              const itemWidth = item.width ?? (item.str.length * fontSize * 0.6);
              const itemHeight = fontSize * 1.3;

              // PDF coords: origin at bottom-left. Viewport transform handles this.
              const x = viewport.convertToViewportPoint(e, f)[0];
              const y = viewport.convertToViewportPoint(e, f)[1] - itemHeight * (viewport.scale / unscaledViewport.scale) * 0.75;
              const w = itemWidth * (viewport.scale / unscaledViewport.scale);
              const h = itemHeight * (viewport.scale / unscaledViewport.scale);

              // Rounded rect highlight
              const r = 2;
              context.beginPath();
              context.moveTo(x + r, y);
              context.lineTo(x + w - r, y);
              context.quadraticCurveTo(x + w, y, x + w, y + r);
              context.lineTo(x + w, y + h - r);
              context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
              context.lineTo(x + r, y + h);
              context.quadraticCurveTo(x, y + h, x, y + h - r);
              context.lineTo(x, y + r);
              context.quadraticCurveTo(x, y, x + r, y);
              context.closePath();
              context.fill();
            }
            context.restore();
          }
        } catch (hlErr) {
          console.warn('Citation highlight failed (non-critical):', hlErr);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'RenderingCancelledException') return;
      console.error('Error rendering page:', err);
      setError('Rendering failed');
    }
  }

  if (!citationViewer.isOpen) return null;

  return (
    <div 
      className={`fixed top-12 bottom-0 right-0 z-[60] flex flex-col border-l border-[var(--border-subtle)] shadow-2xl transition-all duration-300 ${isExpanded ? 'w-[80vw]' : 'w-full md:w-[480px]'}`}
      style={{ background: 'var(--bg-surface)' }}
    >
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shrink-0">
            <ExternalLink size={14} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest truncate">
            {activeMaterial?.name || 'Document Viewer'}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-tertiary)] transition-colors"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button 
            onClick={closeCitationViewer}
            className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-[var(--text-tertiary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="h-10 flex items-center justify-between px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-1 rounded hover:bg-[var(--bg-elevated)] disabled:opacity-20 transition-opacity"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[10px] font-mono font-bold w-14 text-center">
              {currentPage} / {numPages || '?'}
            </span>
            <button 
              disabled={currentPage >= numPages || isLoading}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-1 rounded hover:bg-[var(--bg-elevated)] disabled:opacity-20 transition-opacity"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeMaterial?.storageUrl && (
            <a 
              href={activeMaterial.storageUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)] transition-colors"
              title="Open original file"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-6 flex justify-center bg-[var(--bg-base)] scrollbar-thin"
      >
        {isLoading && !pdfRef.current ? (
          <div className="flex flex-col items-center justify-center gap-3">
             <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
             <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)] animate-pulse">Loading Document...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center max-w-[280px]">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)] mb-1">Rendering Error</p>
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--bg-surface)] transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="relative shadow-2xl mb-8">
            <canvas ref={canvasRef} className="rounded-sm bg-white" />
            
            {/* Context Highlight Indicator (Subtle overlay at the top if excerpt exists) */}
            {citationViewer.highlightedText && (
              <div className="absolute top-4 right-4 z-10 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="px-3 py-1.5 rounded-full bg-yellow-400/90 text-black text-[9px] font-bold uppercase tracking-widest shadow-xl border border-yellow-500/50 backdrop-blur-sm">
                  Verified Passage Below
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Context */}
      {citationViewer.highlightedText && (
        <div className="p-5 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-primary)]">Evidence Passage</p>
          </div>
          <div className="text-[13px] text-[var(--text-secondary)] italic leading-relaxed border-l-2 border-yellow-400/30 pl-4 py-1">
            &ldquo;{citationViewer.highlightedText}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}
