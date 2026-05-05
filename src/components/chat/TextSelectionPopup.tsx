'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, MessageCircle, Plus, RefreshCw, Expand, Pencil } from 'lucide-react';

interface TextSelectionPopupProps {
  selectedText: string;
  position: { top: number; left: number };
  onAskYumeo: (text: string) => void;
  onRewrite?: (text: string) => void;
  onExpand?: (text: string) => void;
  onCopy: (text: string) => void;
  onAddToDraft: (text: string) => void;
  onClose: () => void;
}

/**
 * Floating popup that appears above selected text.
 * Actions: Ask Yumeo | Rewrite | Expand | Copy | Add to draft
 * Disappears on click outside or Escape.
 */
export function TextSelectionPopup({
  selectedText,
  position,
  onAskYumeo,
  onRewrite,
  onExpand,
  onCopy,
  onAddToDraft,
  onClose,
}: TextSelectionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [askMode, setAskMode] = useState(false);
  const [askInput, setAskInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (askMode && inputRef.current) inputRef.current.focus();
  }, [askMode]);

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAskYumeo(`Regarding the passage: "${selectedText}"\n\nQuestion: ${askInput}`);
    onClose();
  };

  return (
    <div
      ref={popupRef}
      role="menu"
      aria-label="Text selection actions"
      className="fixed z-50 shadow-2xl animate-fade-in"
      style={{
        top: position.top - 54,
        left: position.left,
        transform: 'translateX(-50%)',
        background: 'var(--bg-overlay)',
        border: '1px solid var(--border-default)',
        borderRadius: 10,
        minWidth: 260,
        overflow: 'hidden',
      }}
    >
      {askMode ? (
        /* Ask input */
        <form onSubmit={handleAskSubmit} className="flex items-center gap-2 px-3 py-2">
          <input
            ref={inputRef}
            value={askInput}
            onChange={(e) => setAskInput(e.target.value)}
            placeholder="Ask about this passage…"
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: 'var(--text-primary)' }}
            aria-label="Ask Yumeo about selection"
          />
          <button
            type="submit"
            disabled={!askInput.trim()}
            className="text-xs px-2 py-1 rounded disabled:opacity-40"
            style={{ background: 'var(--accent-refs)', color: '#fff' }}
          >
            Ask
          </button>
        </form>
      ) : (
        /* Action buttons */
        <div className="flex items-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <PopupBtn
            icon={<MessageCircle size={13} />}
            label="Ask Yumeo"
            onClick={() => setAskMode(true)}
            accent="var(--accent-refs)"
          />
          {onRewrite && (
            <PopupBtn
              icon={<RefreshCw size={13} />}
              label="Rewrite"
              onClick={() => { onRewrite(selectedText); onClose(); }}
            />
          )}
          {onExpand && (
            <PopupBtn
              icon={<Expand size={13} />}
              label="Expand"
              onClick={() => { onExpand(selectedText); onClose(); }}
            />
          )}
          <PopupBtn
            icon={<Pencil size={13} />}
            label="Edit"
            onClick={() => { onAddToDraft(selectedText); onClose(); }}
          />
          <PopupBtn
            icon={<Copy size={13} />}
            label="Copy"
            onClick={() => { onCopy(selectedText); onClose(); }}
          />
          <PopupBtn
            icon={<Plus size={13} />}
            label="Add"
            onClick={() => { onAddToDraft(selectedText); onClose(); }}
          />
        </div>
      )}
    </div>
  );
}

function PopupBtn({
  icon,
  label,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: string;
}) {
  return (
    <button
      onClick={onClick}
      role="menuitem"
      className="flex flex-col items-center gap-0.5 px-3 py-2 text-center transition-colors hover:bg-white/5"
      style={{ color: accent ?? 'var(--text-secondary)', minWidth: 44 }}
    >
      {icon}
      <span className="text-[10px] leading-none">{label}</span>
    </button>
  );
}
