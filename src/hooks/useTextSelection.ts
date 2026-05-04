import { useCallback, useEffect, useRef, useState } from 'react';

interface SelectionData {
  text: string;
  position: { top: number; left: number };
}

/**
 * Hook to detect text selection in a container element.
 * Returns selection data and a ref to attach to the container.
 */
export function useTextSelection() {
  const [selection, setSelection] = useState<SelectionData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    
    // Check if text is selected
    if (!sel || sel.toString().length === 0) {
      setSelection(null);
      return;
    }

    // Get the selected text
    const selectedText = sel.toString().trim();
    if (selectedText.length === 0) {
      setSelection(null);
      return;
    }

    // Get selection range and calculate popup position
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position popup above the selection, centered horizontally
    const top = rect.top + window.scrollY;
    const left = rect.left + rect.width / 2 + window.scrollX;

    setSelection({
      text: selectedText,
      position: { top, left },
    });
  }, []);

  const handleClickOutside = useCallback(() => {
    setSelection(null);
  }, []);

  // Attach mouseup listener to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  // Close popup on outside click
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  return {
    selection,
    containerRef,
    clearSelection,
  };
}
