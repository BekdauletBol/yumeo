import { useMemo, useState } from 'react';
import { FileText, Clock, Trash2, ArrowLeft, BookOpen } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { formatFileSize } from '@/lib/utils/truncate';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { updateMaterialAction } from '@/app/actions/materials';
import { ReportEditorModal } from '@/components/report/ReportEditorModal';

export function DraftsSection() {
  const materials = useMaterialsStore((s) => s.materials);
  const drafts = useMemo(
    () => materials.filter((m) => m.section === 'drafts'),
    [materials],
  );
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportEditorOpen, setReportEditorOpen] = useState(false);
  const [selectedDraftForReport, setSelectedDraftForReport] = useState<string | undefined>();
  const updateMaterial = useMaterialsStore((s) => s.updateMaterial);
  const removeMaterial = useMaterialsStore((s) => s.removeMaterial);

  const activeDraft = useMemo(
    () => drafts.find(d => d.id === editingId),
    [drafts, editingId]
  );

  const handleSave = async (content: string) => {
    if (!editingId) return;
    const draft = drafts.find(d => d.id === editingId);
    if (!draft) return;

    const updated = { ...draft, content };
    updateMaterial(updated);
    await updateMaterialAction(editingId, { content });
  };

  if (editingId && activeDraft) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
          <button 
            onClick={() => setEditingId(null)}
            className="flex items-center gap-1 text-xs hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={12} />
            Back to list
          </button>
          <span className="text-xs font-medium truncate max-w-[150px]" style={{ color: 'var(--text-primary)' }}>
            {activeDraft.name}
          </span>
          <div className="w-8" /> {/* Spacer */}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <TiptapEditor 
            initialContent={activeDraft.content} 
            onSave={handleSave} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 h-full overflow-y-auto">
      {/* Write Report Button */}
      <button
        onClick={() => {
          setReportEditorOpen(true);
          setSelectedDraftForReport(undefined);
        }}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium text-xs transition-colors"
        style={{
          background: 'var(--accent-drafts)',
          color: 'white',
        }}
      >
        <BookOpen size={14} />
        Write Report
      </button>

      <p className="text-section-label" style={{ color: 'var(--accent-drafts)' }}>
        Research Drafts
        <span
          className="ml-2 text-xs"
          style={{
            color: 'var(--text-tertiary)',
            textTransform: 'none',
            letterSpacing: 0,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {drafts.length} files
        </span>
      </p>

      {drafts.length === 0 ? (
        <div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Upload drafts or create a new one to begin writing.
          </p>
          <FileUploadZone section="drafts" />
        </div>
      ) : (
        <div className="space-y-2">
          {drafts.map((draft) => (
            <button
              key={draft.id}
              onClick={() => setEditingId(draft.id)}
              aria-label={draft.name}
              className="w-full text-left p-2.5 rounded-md transition-colors relative group"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-start gap-2">
                <FileText
                  size={12}
                  className="mt-0.5 shrink-0"
                  style={{ color: 'var(--accent-drafts)' }}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0 pr-6">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {draft.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <Clock size={9} aria-hidden="true" />
                      {draft.createdAt.toLocaleDateString()}
                    </span>
                    {draft.metadata.fileSize ? (
                      <span
                        className="text-xs"
                        style={{
                          color: 'var(--text-tertiary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {formatFileSize(draft.metadata.fileSize)}
                      </span>
                    ) : null}
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMaterial(draft.id);
                  }}
                  className="absolute right-2 top-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-white/10"
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-label={`Delete draft`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </button>
          ))}
          <FileUploadZone section="drafts" compact />
        </div>
      )}

      {/* Report Editor Modal */}
      <ReportEditorModal
        isOpen={reportEditorOpen}
        onClose={() => {
          setReportEditorOpen(false);
          setSelectedDraftForReport(undefined);
        }}
        draftId={selectedDraftForReport}
      />
    </div>
  );
}