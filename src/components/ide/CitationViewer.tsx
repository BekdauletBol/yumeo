'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink, Download, Maximize2, Minimize2 } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import * as pdfjs from 'pdfjs-dist';

// Set worker path - assuming it's in public folder as per project structure
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export function CitationViewer() {
  const { citationViewer, closeCitationViewer } = useUIStore();
  const { materials } = useMaterialsStore();
  const [numPages, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  const activeMaterial = materials.find(m => m.id === citationViewer.materialId);

  useEffect(() => {
    if (citationViewer.isOpen && citationViewer.pageNumber) {
      setCurrentPage(citationViewer.pageNumber);
    }
  }, [citationViewer.isOpen, citationViewer.pageNumber]);

  useEffect(() => {
    if (!citationViewer.isOpen || !activeMaterial?.storageUrl) return;

    async function loadPdf() {
      if (!activeMaterial?.storageUrl) return;
      
      try {
        setIsLoading(true);
        const loadingTask = pdfjs.getDocument(activeMaterial.storageUrl);
        const pdf = await loadingTask.promise;
        setPageCount(pdf.numPages);
        renderPage(pdf, currentPage);
      } catch (err) {
        console.error('Failed to load PDF:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPdf();
  }, [citationViewer.isOpen, activeMaterial?.storageUrl, currentPage]);

  async function renderPage(pdf: any, pageNum: number) {
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      // Adjust scale based on container width
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

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
      console.error('Error rendering page:', err);
    }
  }

  if (!citationViewer.isOpen) return null;

  return (
    <div 
      className={`fixed top-12 bottom-0 right-0 z-[60] flex flex-col border-l border-[var(--border-subtle)] shadow-2xl transition-all duration-300 ${isExpanded ? 'w-[80vw]' : 'w-full md:w-[450px]'}`}
      style={{ background: 'var(--bg-surface)' }}
    >
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
            <Maximize2 size={14} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest truncate max-w-[200px]">
            {activeMaterial?.name || 'Document Viewer'}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-tertiary)] transition-colors"
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
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-1 rounded hover:bg-[var(--bg-elevated)] disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[10px] font-mono font-bold w-12 text-center">
              {currentPage} / {numPages || '?'}
            </span>
            <button 
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-1 rounded hover:bg-[var(--bg-elevated)] disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a 
            href={activeMaterial?.storageUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-4 flex justify-center bg-[var(--bg-base)]"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3">
             <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
             <p className="text-[10px] uppercase tracking-tighter text-[var(--text-tertiary)]">Loading PDF...</p>
          </div>
        ) : (
          <div className="relative shadow-2xl">
            <canvas ref={canvasRef} className="max-w-full" />
            {/* Simple highlight overlay if text provided */}
            {citationViewer.highlightedText && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
                <div className="bg-yellow-400 w-full h-8 blur-sm" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Context */}
      {citationViewer.highlightedText && (
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-primary)] mb-2">Relevant Passage</p>
          <div className="text-xs text-[var(--text-secondary)] italic leading-relaxed line-clamp-3">
            &ldquo;{citationViewer.highlightedText}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}
