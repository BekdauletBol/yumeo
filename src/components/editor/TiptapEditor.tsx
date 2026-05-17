'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { GhostText } from './extensions/GhostText';
import { useYuportAI } from '@/hooks/useYuportAI';
import { Loader2, Sparkles } from 'lucide-react';

interface TiptapEditorProps {
  initialContent: string;
  onChange?: (content: string) => void;
  className?: string;
  placeholder?: string;
  isActive?: boolean;
}

export function TiptapEditor({
  initialContent,
  onChange,
  className,
  placeholder = 'Start writing...',
  isActive = true,
}: TiptapEditorProps) {
  const [isAiPanelOpen, setIsAiPromptOpen] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Typography,
      Image,
      Placeholder.configure({
        placeholder,
      }),
      GhostText.configure({
        onAccept: (text) => {
          editor?.commands.insertContent(text);
        },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[600px] font-body leading-relaxed text-text-primary p-12 md:p-16',
          'selection:bg-accent-primary/30 selection:text-white',
        ),
      },
    },
  });

  const { isGenerating, ghostText, generateContinuation, applyEdit, setGhostText } = useYuportAI(editor);

  // Sync ghost text to extension storage
  useEffect(() => {
    if (editor) {
      editor.storage.ghostText.ghostText = ghostText;
      editor.view.dispatch(editor.state.tr); // Trigger decoration update
    }
  }, [ghostText, editor]);

  // Keyboard Shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;

      // Cmd+K for AI Edit
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsAiPromptOpen(true);
      }

      // Trigger continuation on space if at end of sentence (simplified)
      if (e.key === ' ' && editor.state.selection.empty) {
        const textBefore = editor.state.doc.textBetween(Math.max(0, editor.state.selection.from - 50), editor.state.selection.from);
        if (textBefore.endsWith('.') || textBefore.endsWith('?') || textBefore.endsWith('!')) {
          // debounce or only trigger if ghostText is null
          if (!ghostText) void generateContinuation();
        }
      }
      
      // Clear ghost text on backspace or other keys
      if (e.key === 'Backspace' || e.key === 'Escape') {
        setGhostText(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, isActive, ghostText, generateContinuation, setGhostText]);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInstruction.trim()) return;
    await applyEdit(aiInstruction);
    setAiInstruction('');
    setIsAiPromptOpen(false);
  };

  if (!editor) return null;

  return (
    <div className={cn('tiptap-page relative bg-bg-surface border border-border-subtle shadow-2xl transition-all duration-300', isActive ? 'ring-2 ring-accent-primary/20' : 'opacity-80 scale-[0.98]', className)}>
      <EditorContent editor={editor} />

      {/* AI Inline Prompt */}
      {isAiPanelOpen && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in zoom-in-95 duration-200">
          <form onSubmit={handleAiSubmit} className="bg-bg-overlay border border-border-default rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-accent-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Yuport AI Editor</span>
            </div>
            <input 
              autoFocus
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              placeholder="e.g. 'Rewrite to be more academic' or 'Insert an abstract'"
              className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all"
            />
            <div className="flex justify-between items-center mt-4">
               <p className="text-[9px] text-text-tertiary uppercase font-mono">Press ESC to cancel</p>
               <button 
                 type="submit"
                 disabled={isGenerating}
                 className="bg-accent-primary text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
               >
                 {isGenerating ? <Loader2 size={12} className="animate-spin" /> : 'Apply Edit'}
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Page Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-2 py-1 rounded bg-bg-elevated border border-border-subtle select-none">
        <span className="text-[9px] font-mono font-bold text-text-tertiary uppercase tracking-tighter">AI-Enabled Page</span>
        {isGenerating && <Loader2 size={10} className="text-accent-primary animate-spin" />}
      </div>
      
      <style jsx global>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-tertiary);
          pointer-events: none;
          height: 0;
          font-family: var(--font-mono);
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.1em;
        }
        
        .tiptap h1 { font-family: var(--font-mono); font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem; }
        .tiptap h2 { font-family: var(--font-mono); font-weight: bold; text-transform: uppercase; letter-spacing: 0.02em; margin-top: 2rem; }
        
        .tiptap blockquote {
          border-left: 3px solid var(--accent-primary);
          padding-left: 1.5rem;
          font-style: italic;
          color: var(--text-secondary);
        }
        
        .tiptap mark {
          background-color: rgba(232, 97, 26, 0.2);
          color: inherit;
          padding: 0 2px;
          border-radius: 2px;
        }

        .ghost-text {
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
        }
      `}</style>
    </div>
  );
}
