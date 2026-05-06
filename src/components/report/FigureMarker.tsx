'use client';

import { useMemo } from 'react';
import { ImageIcon } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';

/**
 * Pattern that matches figure markers inserted by the AI or drag-dropped from
 * the Figures panel.
 *
 * Examples:
 *   [FIGURE: results.pdf, Figure 3]
 *   [FIGURE: chart.png, Fig. 1 (chart.png, p.2)]
 */
export const FIGURE_MARKER_REGEX = /\[FIGURE:\s*([^,\]]+),\s*([^\]]+)\]/g;

interface FigureMarkerProps {
  /** The raw marker string, e.g. "[FIGURE: results.pdf, Figure 3]" */
  marker: string;
  /** The filename portion parsed from the marker */
  filename: string;
  /** The figure label / reference parsed from the marker */
  figureLabel: string;
}

/**
 * Renders a single [FIGURE: ...] marker as an image thumbnail with a caption.
 * Looks up the figure by filename in the materials store.
 */
export function FigureMarker({ filename, figureLabel, marker }: FigureMarkerProps) {
  const materials = useMaterialsStore((s) => s.materials);

  const { dataUrl, caption } = useMemo(() => {
    // Find the material by filename (case-insensitive)
    const lowerFilename = filename.trim().toLowerCase();
    const fig = materials.find(
      (m) => m.section === 'figures' && m.name.toLowerCase() === lowerFilename,
    );

    if (!fig) return { dataUrl: undefined, caption: figureLabel };

    // Check for per-page extracted images (PDFs)
    const imgs = fig.metadata.extractedImages;
    if (imgs && imgs.length > 0) {
      // Try to parse a page number from the label, e.g. "Fig. 1 (results.pdf, p.2)"
      const pageMatch = figureLabel.match(/p\.(\d+)/i);
      const pageIndex = pageMatch ? parseInt(pageMatch[1] ?? '1', 10) - 1 : 0;
      const safeIndex = Math.max(0, Math.min(pageIndex, imgs.length - 1));
      return {
        dataUrl: imgs[safeIndex],
        caption: fig.metadata.caption || figureLabel,
      };
    }

    // Direct image upload
    if (fig.metadata.imageDataUrl) {
      return {
        dataUrl: fig.metadata.imageDataUrl,
        caption: fig.metadata.caption || figureLabel,
      };
    }

    return { dataUrl: undefined, caption: figureLabel };
  }, [materials, filename, figureLabel]);

  if (!dataUrl) {
    // Fallback: render the marker text with a placeholder
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs"
        style={{
          background: 'rgba(95,207,128,0.08)',
          border: '1px dashed rgba(95,207,128,0.4)',
          color: 'var(--accent-figures)',
          fontFamily: 'var(--font-mono)',
          verticalAlign: 'middle',
        }}
        title={`Figure not found: ${filename}`}
      >
        <ImageIcon size={12} aria-hidden="true" />
        {marker}
      </span>
    );
  }

  return (
    <figure
      className="my-4 inline-block max-w-full"
      style={{ verticalAlign: 'middle' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={caption}
        className="max-w-full rounded"
        style={{
          border: '1px solid var(--border-subtle)',
          maxHeight: '400px',
          objectFit: 'contain',
          display: 'block',
        }}
      />
      {caption && (
        <figcaption
          className="mt-1 text-xs text-center"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Replace all [FIGURE: ...] markers in a string with React elements.
 * Returns an array of strings and FigureMarker elements.
 */
export function renderWithFigures(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = new RegExp(FIGURE_MARKER_REGEX.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    // Text before the marker
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const [fullMatch, filename, figureLabel] = match;
    if (filename && figureLabel) {
      parts.push(
        <FigureMarker
          key={`fig-${match.index}`}
          marker={fullMatch}
          filename={filename}
          figureLabel={figureLabel}
        />,
      );
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}
