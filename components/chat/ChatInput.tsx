'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { cn } from '@/lib/utils/cn';

interface ChatInputProps {
  onSubmit: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_CHARS = 4000;

/**
 * Chat input bar at the bottom of the chat panel.
 * - ⌘Enter / Ctrl+Enter to submit
 * - Enter for newline
 * - Warns when no materials are loaded
 * - Shows character counter near limit
 */
export function ChatInput({ onSubmit, disabled = false, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const totalMaterials = useMaterialsStore((s) => s.materials.length);

  const isDisabled = disabled || isStreaming || isSubmitting;
  const charsLeft = MAX_CHARS - value.length;
  const isNearLimit = charsLeft < 200;

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [value]);

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;

    setValue('');
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setIsSubmitting(false);
    }
    textareaRef.current?.focus();
  }, [value, isDisabled, onSubmit]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // ⌘Enter or Ctrl+Enter → submit
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  const noMaterials = totalMaterials === 0;

  return (
    <div
      className="px-4 py-3 border-t"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}
    >
      {/* No-materials warning */}
      {noMaterials && (
        <div
          className="flex items-center gap-2 mb-2 px-3 py-1.5 border text-xs"
          role="alert"
          style={{
            background: 'var(--bg-elevated)',
            borderColor: 'var(--border-default)',
            color: 'var(--status-warning)',
          }}
        >
          <AlertCircle size={12} aria-hidden="true" />
          <span>
            Upload a reference file first — Yumeo answers only from your materials.
          </span>
        </div>
      )}

      {/* Input row */}
      <div
        className="flex items-end gap-2 px-3 py-2 border"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border-default)',
          transition: 'border-color var(--transition-fast)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={
            placeholder ??
            (noMaterials
              ? 'Upload materials first…'
              : 'Ask about your research materials… (⌘Enter to send)')
          }
          aria-label="Research question input"
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
          style={{
            color: 'var(--text-primary)',
            caretColor: 'var(--text-accent)',
          }}
        />

        {/* Character counter (near limit only) */}
        {isNearLimit && value.length > 0 && (
          <span
            className="text-xs shrink-0 self-center"
            style={{
              color: charsLeft < 50 ? 'var(--status-error)' : 'var(--status-warning)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {charsLeft}
          </span>
        )}

        {/* Send button */}
        <button
          onClick={() => void handleSubmit()}
          disabled={isDisabled || value.trim() === ''}
          aria-label="Send message (⌘Enter)"
          className={cn(
            'shrink-0 w-7 h-7 border flex items-center justify-center transition-all',
            value.trim() && !isDisabled ? 'opacity-100' : 'opacity-30',
          )}
          style={{
            background: 'transparent',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-default)',
          }}
        >
          {isStreaming || isSubmitting ? (
            <span
              className="w-3 h-3 rounded-sm animate-pulse"
              style={{ background: '#000' }}
              aria-hidden="true"
            />
          ) : (
            <Send size={13} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
        <kbd style={{ fontFamily: 'var(--font-mono)' }}>⌘↵</kbd> to send
        {' · '}
        <kbd style={{ fontFamily: 'var(--font-mono)' }}>↵</kbd> for new line
      </p>
    </div>
  );
}