'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader2, Command } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { cn } from '@/lib/utils/cn';

export function ChatInput({ onSubmit }: { onSubmit?: (text: string) => Promise<void> }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isStreaming: isLoading } = useStreamingChat();
  const activeProject = useProjectStore((s) => s.activeProject);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !activeProject) return;
    const content = input.trim();
    setInput('');
    if (onSubmit) {
      await onSubmit(content);
    } else {
      await sendMessage(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="p-6 bg-black border-t border-border-subtle">
      <div className="max-w-4xl mx-auto relative group">
        <div className={cn(
          "relative flex items-end gap-2 p-3 bg-[#111111] border border-border-subtle rounded-xl transition-all duration-300",
          "focus-within:border-border-default focus-within:ring-1 focus-within:ring-white/5 shadow-sm"
        )}>
          <button className="p-2 text-text-tertiary hover:text-text-secondary transition-colors rounded-lg">
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Yumeo about your research..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-text-primary placeholder:text-text-tertiary resize-none py-2 min-h-[40px] font-body"
          />

          <div className="flex items-center gap-2 px-2 py-1 bg-black/40 rounded-lg text-[10px] font-mono font-bold text-text-tertiary border border-border-subtle select-none">
            <Command size={10} /> ENTER
          </div>

          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || isLoading}
            className={cn(
              "p-2.5 rounded-xl transition-all flex items-center justify-center",
              input.trim() && !isLoading
                ? "bg-accent-primary text-white"
                : "bg-bg-elevated text-text-tertiary cursor-not-allowed"
            )}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>

        <p className="mt-3 text-[10px] text-center text-text-tertiary font-mono font-bold uppercase tracking-[0.2em]">
          Yumeo only uses your uploaded knowledge base.
        </p>
      </div>
    </div>
  );
}
