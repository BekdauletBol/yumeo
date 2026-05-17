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
