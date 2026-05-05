'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Download, Wand2, Save } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useReportEditorStore } from '@/stores/reportEditorStore';
import { useReportAutoSave } from '@/hooks/useReportAutoSave';
import { useTextSelection } from '@/hooks/useTextSelection';
import { TextSelectionPopup } from '@/components/chat/TextSelectionPopup';
import { ReportAISidebar } from './ReportAISidebar';
import { ExportModal } from './ExportModal';
import { cn } from '@/lib/utils/cn';
import { nanoid } from 'nanoid';

/**
 * Full-screen report editor modal.
 * Opens automatically after AI generation or when user opens a draft.
 * Supports: inline text-selection actions, AI sidebar, autocomplete, export.
 */
export function ReportEditorModal() {
  const { isOpen, initialContent, initialTitle, draftId, close } = useReportEditorStore();

  const activeProject = useProjectStore((s) => s.activeProject);
  const materials = useMaterialsStore((s) => s.materials);
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const updateMaterial = useMaterialsStore((s) => s.updateMaterial);

  const draft = draftId ? materials.find((m) => m.id === draftId) : null;

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>(draftId);

  // Autocomplete state
  const [ghost, setGhost] = useState('');
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const autocompleteTimer = useRef<ReturnType<typeof setTimeout>>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Text-selection popup
  const { selection, containerRef, clearSelection } = useTextSelection();

  const [showExportModal, setShowExportModal] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (draft) {
      setTitle(draft.name);
      setContent(draft.content ?? '');
      setActiveDraftId(draft.id);
    } else {
      setTitle(initialTitle);
      setContent(initialContent);
      setActiveDraftId(undefined);
    }
    setGhost('');
  }, [isOpen, initialContent, initialTitle, draft]);

  // Auto-save
  const { isSaved } = useReportAutoSave({
    projectId: activeProject?.id,
    draftId: activeDraftId,
    title,
    content,
    onSave: async (updatedContent) => {
      if (activeDraftId) {
        const existing = materials.find((m) => m.id === activeDraftId);
        if (existing) updateMaterial({ ...existing, content: updatedContent });
      }
      setContent(updatedContent);
    },
  });

  // Save as new draft if no existing draft
  const handleManualSave = () => {
    if (!activeProject) return;
    if (activeDraftId) return; // already auto-saves
    const id = nanoid();
    addMaterial({
      id,
      projectId: activeProject.id,
      section: 'drafts',
      name: title,
      content,
      metadata: { fileType: 'markdown', fileSize: new Blob([content]).size },
      createdAt: new Date(),
    });
    setActiveDraftId(id);
  };

  // ── AI Autocomplete ────────────────────────────────────────────────────────
  const triggerAutocomplete = (currentContent: string) => {
    if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);
    autocompleteTimer.current = setTimeout(async () => {
      const last500 = currentContent.slice(-500);
      if (!last500.trim() || !activeProject) return;
      try {
        setIsAutocompleting(true);
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: `Continue writing the following text with 1-2 sentences. Match the style and tone exactly. Only return the continuation text, nothing else:\n\n...${last500}`,
              },
            ],
            systemPrompt:
              'You are an AI writing assistant. Complete the text continuation in the same academic style. Return only the completion text, no preamble.',
            projectId: activeProject.id,
            userQuery: 'autocomplete',
            model: activeProject.settings.agentModel,
          }),
        });
        if (!res.ok || !res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let suggestion = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          suggestion += decoder.decode(value, { stream: true });
        }
        setGhost(suggestion.trim());
      } catch {
        // Autocomplete is best-effort — never block writing
      } finally {
        setIsAutocompleting(false);
      }
    }, 300);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    setGhost('');
    triggerAutocomplete(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && ghost) {
      e.preventDefault();
      setContent((prev) => prev + ghost);
      setGhost('');
      return;
    }
    if (e.key === 'Escape' && ghost) {
      setGhost('');
    }
  };

  // ── Selection popup actions ────────────────────────────────────────────────
  const handleAskAboutSelection = (text: string) => {
    clearSelection();
    setShowAISidebar(true);
    // The sidebar will pick this up via selectedText prop
    setSelectedPassage(text);
  };
  const [selectedPassage, setSelectedPassage] = useState('');

  const handleRewriteSelection = async (text: string) => {
    if (!activeProject) return;
    clearSelection();
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Rewrite the following passage in the same academic style and length. Return ONLY the rewritten text:\n\n"${text}"`,
            },
          ],
          systemPrompt: 'You are an academic writing editor. Rewrite the given passage. Return only the rewritten text, no preamble.',
          projectId: activeProject.id,
          userQuery: `rewrite: ${text}`,
          model: activeProject.settings.agentModel,
        }),
      });
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rewritten = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        rewritten += decoder.decode(value, { stream: true });
      }
      setContent((prev) => prev.replace(text, rewritten.trim()));
    } catch {
      // best-effort
    }
  };

  const handleExpandSelection = async (text: string) => {
    if (!activeProject) return;
    clearSelection();
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Expand the following passage with more detail and supporting evidence from the uploaded materials. Return the original text plus the expansion:\n\n"${text}"`,
            },
          ],
          systemPrompt: 'You are an academic writing assistant. Expand the passage using material from the uploaded references. Return the original plus expansion.',
          projectId: activeProject.id,
          userQuery: `expand: ${text}`,
          model: activeProject.settings.agentModel,
        }),
      });
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let expanded = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        expanded += decoder.decode(value, { stream: true });
      }
      setContent((prev) => prev.replace(text, expanded.trim()));
    } catch {
      // best-effort
    }
  };

  if (!isOpen) return null;

  const hasReferences = materials.some((m) => m.section === 'references');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full h-full max-w-7xl max-h-screen flex flex-col"
        style={{ background: 'var(--bg-base)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-default)' }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent text-base font-medium outline-none"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            placeholder="Report title…"
            aria-label="Report title"
          />

          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {isAutocompleting && <span>thinking…</span>}
            {isSaved && activeDraftId && <span>Saved</span>}
            {ghost && (
              <span style={{ color: 'var(--accent-refs)' }}>
                Tab to accept suggestion
              </span>
            )}
          </div>

          {/* Save as draft */}
          {!activeDraftId && (
            <button
              onClick={handleManualSave}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
              aria-label="Save as draft"
            >
              <Save size={13} />
              Save draft
            </button>
          )}

          {/* Export — opens format picker */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
            aria-label="Export report"
          >
            <Download size={13} />
            Export
          </button>

          {/* AI Sidebar toggle */}
          <button
            onClick={() => setShowAISidebar((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all',
              showAISidebar
                ? 'text-white'
                : 'hover:opacity-80',
            )}
            style={{
              background: showAISidebar ? 'var(--accent-refs)' : 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: showAISidebar ? '#fff' : 'var(--text-secondary)',
            }}
            aria-label="Toggle AI assistant"
          >
            <Wand2 size={13} />
            AI
          </button>

          <button
            onClick={close}
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
            aria-label="Close editor"
          >
            <X size={18} style={{ color: 'var(--text-primary)' }} />
          </button>
        </div>

        {/* ── Smart Empty State (no references) ── */}
        {!hasReferences && !content && (
          <div
            className="mx-auto mt-8 p-6 rounded-xl max-w-md text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              You haven&apos;t uploaded any references yet.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  // Allow writing from scratch — just dismiss the warning
                  if (confirm('I\'ll write without grounded sources. Citations may not be verifiable. Continue?')) {
                    if (textareaRef.current) textareaRef.current.focus();
                  }
                }}
                className="text-xs px-4 py-2 rounded-lg"
                style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
              >
                Write from scratch
              </button>
              <button
                onClick={close}
                className="text-xs px-4 py-2 rounded-lg"
                style={{ background: 'var(--accent-refs)', color: '#fff' }}
              >
                Upload references first
              </button>
            </div>
          </div>
        )}

        {/* ── Main area ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor */}
          <div ref={containerRef} className="flex-1 relative overflow-y-auto px-12 py-8">
            {/* Ghost text overlay (autocomplete) */}
            {ghost && (
              <div
                className="absolute inset-0 pointer-events-none px-12 py-8 text-sm whitespace-pre-wrap break-words"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'transparent',
                  lineHeight: '1.75',
                }}
              >
                {content}
                <span style={{ color: 'var(--text-tertiary)', opacity: 0.6 }}>
                  {ghost}
                </span>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                hasReferences
                  ? 'Start writing… AI will suggest continuations as you type (Tab to accept).'
                  : 'Write here…'
              }
              className="w-full h-full bg-transparent outline-none resize-none text-sm leading-7"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                minHeight: 400,
                caretColor: 'var(--accent-refs)',
              }}
              aria-label="Report content"
            />

            {/* Text selection popup */}
            {selection && (
              <TextSelectionPopup
                selectedText={selection.text}
                position={selection.position}
                onAskYumeo={handleAskAboutSelection}
                onRewrite={handleRewriteSelection}
                onExpand={handleExpandSelection}
                onCopy={(text) => { void navigator.clipboard.writeText(text); clearSelection(); }}
                onAddToDraft={(text) => { setContent((prev) => prev + '\n\n' + text); clearSelection(); }}
                onClose={clearSelection}
              />
            )}
          </div>

          {/* AI Sidebar */}
          {showAISidebar && (
            <ReportAISidebar
              projectId={activeProject?.id}
              cursorPosition={content.length}
              selectedPassage={selectedPassage}
              onInsertContent={(text) => setContent((prev) => prev + '\n\n' + text)}
              onClose={() => { setShowAISidebar(false); setSelectedPassage(''); }}
            />
          )}
        </div>
      </div>

      {/* Export format picker modal */}
      {showExportModal && (
        <ExportModal
          title={title}
          content={content}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
