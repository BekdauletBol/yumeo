'use client';

import { useEffect, useRef } from 'react';
import { Copy, MessageCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TextSelectionPopupProps {
  selectedText: string;
  position: { top: number; left: number };
  onAskYumeo: (text: string) => void;
  onCopy: (text: string) => void;
  onAddToDraft: (text: string) => void;
  onClose: () => void;
}

/**
 * Floating popup that appears above selected text in AI responses.
 * Provides options to ask Yumeo, copy, or add to draft.
 */
export function TextSelectionPopup({
  selectedText,
  position,
  onAskYumeo,
  onCopy,
  onAddToDraft,
  onClose,
}: TextSelectionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className={cn(
        'fixed z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-lg',
        'flex gap-2 p-2 animate-in fade-in-0 zoom-in-95 duration-200'
      )}
      style={{
        top: `${position.top - 50}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Ask Yumeo button */}
      <button
        onClick={() => {
          onAskYumeo(selectedText);
          onClose();
        }}
        title="Ask Yumeo about this passage"
        className={cn(
          'p-2 rounded hover:bg-slate-800 transition-colors',
          'flex items-center gap-1.5 text-xs text-slate-200'
        )}
      >
        <MessageCircle size={16} />
        <span>Ask</span>
      </button>

      {/* Copy button */}
      <button
        onClick={() => {
          onCopy(selectedText);
          onClose();
        }}
        title="Copy selected text"
        className={cn(
          'p-2 rounded hover:bg-slate-800 transition-colors',
          'flex items-center gap-1.5 text-xs text-slate-200'
        )}
      >
        <Copy size={16} />
        <span>Copy</span>
      </button>

      {/* Add to Draft button */}
      <button
        onClick={() => {
          onAddToDraft(selectedText);
          onClose();
        }}
        title="Add selected text to draft"
        className={cn(
          'p-2 rounded hover:bg-slate-800 transition-colors',
          'flex items-center gap-1.5 text-xs text-slate-200'
        )}
      >
        <Plus size={16} />
        <span>Add</span>
      </button>
    </div>
  );
}
