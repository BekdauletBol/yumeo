'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader2, Command, Layout, AlignLeft } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { cn } from '@/lib/utils/cn';

export function ChatInput({ onSubmit }: { onSubmit?: (text: string) => Promise<void> }) {
  const [input, setInput] = useState('');
  const [showFormatPrompt, setShowStructurePrompt] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isStreaming: isLoading } = useStreamingChat();
  
  const activeProject = useProjectStore((s) => s.activeProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const materials = useMaterialsStore((s) => s.materials);
  
  const hasTemplate = materials.some(m => m.section === 'templates');
  const formatPreference = activeProject?.settings.outputFormatPreference;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async (overrideFormat?: 'structured' | 'plain') => {
    if (!input.trim() || isLoading || !activeProject) return;

    // If no template and no preference set, ask user
    if (!hasTemplate && !formatPreference && !overrideFormat) {
      setShowStructurePrompt(true);
      return;
    }

    const content = input.trim();
    setInput('');
    setShowStructurePrompt(false);

    if (onSubmit) {
      await onSubmit(content);
    } else {
      await sendMessage(content);
    }
  };

  const setFormatAndSend = (format: 'structured' | 'plain') => {
    if (!activeProject) return;
    updateProject({
      ...activeProject,
      settings: { ...activeProject.settings, outputFormatPreference: format }
    });
    void handleSend(format);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleSend();
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="p-4 md:p-6 border-t border-border-subtle" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-4xl mx-auto relative group">
        
        {/* Format Preference Prompt */}
        {showFormatPrompt && (
          <div className="absolute bottom-full left-0 right-0 mb-4 flex flex-col items-center animate-in slide-in-from-bottom-2 duration-300">
            <div className="bg-bg-overlay border border-border-default rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-sm w-full">
              <p className="text-xs font-bold text-text-primary mb-3 text-center uppercase tracking-widest">Select Output Structure</p>
              <p className="text-[11px] text-text-secondary mb-4 text-center leading-relaxed">
                No template detected. How should Yumeo format your response?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setFormatAndSend('structured')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-bg-surface border border-border-subtle hover:border-accent-primary transition-all group"
                >
                  <Layout size={18} className="text-accent-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">Structured</span>
                </button>
                <button 
                  onClick={() => setFormatAndSend('plain')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-bg-surface border border-border-subtle hover:border-accent-primary transition-all group"
                >
                  <AlignLeft size={18} className="text-text-tertiary group-hover:text-accent-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">Plain Text</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={cn(
          "relative flex items-end gap-2 p-3 border border-border-subtle rounded-xl transition-all duration-300",
          "focus-within:border-border-default focus-within:ring-1 focus-within:ring-white/5 shadow-sm",
          showFormatPrompt && "opacity-50 pointer-events-none blur-[1px]"
        )}
        style={{ background: 'var(--bg-surface)' }}
        >
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

          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold text-text-tertiary border border-border-subtle select-none" style={{ background: 'var(--bg-overlay)' }}>
            <Command size={10} /> + ENTER
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

        <div className="mt-3 flex items-center justify-center gap-4">
          <p className="text-[11px]" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
            yumeo only uses your uploaded knowledge base.
          </p>
          {formatPreference && !hasTemplate && (
            <button 
              onClick={() => setShowStructurePrompt(true)}
              className="text-[10px] font-mono font-bold text-accent-primary uppercase tracking-tighter hover:underline"
            >
              Mode: {formatPreference} (Change)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
