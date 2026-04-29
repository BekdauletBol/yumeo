import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Settings, Shield, Zap, Globe } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { updateProjectAction } from '@/app/actions/projects';

export function SettingsDialog() {
  const { activeProject, setActiveProject } = useProjectStore();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!activeProject) return null;

  const handleSave = async (updates: any) => {
    setIsSaving(true);
    try {
      const newSettings = { ...activeProject.settings, ...updates };
      const updatedProject = { ...activeProject, settings: newSettings };
      
      await updateProjectAction(activeProject.id, { settings: newSettings });
      setActiveProject(updatedProject);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          aria-label="Project settings"
          className="p-1 rounded hover:bg-white/10 transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <Settings size={16} />
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-2xl z-[51] outline-none"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Project Settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded hover:bg-white/10" style={{ color: 'var(--text-tertiary)' }}>
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-6">
            {/* Model Selection */}
            <div className="space-y-3">
              <label className="text-xs font-medium uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                <Zap size={14} style={{ color: 'var(--accent-refs)' }} />
                AI Intelligence
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet', desc: 'Best for research & writing' },
                  { id: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku', desc: 'Fastest for quick queries' },
                  { id: 'claude-3-opus-latest', label: 'Claude 3 Opus', desc: 'Deepest reasoning' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSave({ agentModel: m.id })}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      activeProject.settings.agentModel === m.id 
                        ? 'ring-1' 
                        : 'hover:border-white/20'
                    }`}
                    style={{
                      background: activeProject.settings.agentModel === m.id ? 'rgba(74,158,255,0.08)' : 'var(--bg-elevated)',
                      borderColor: activeProject.settings.agentModel === m.id ? 'var(--accent-refs)' : 'var(--border-subtle)'
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Grounding Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div className="space-y-0.5">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Shield size={14} style={{ color: 'var(--status-success)' }} />
                  Strict Grounding
                </label>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Only use uploaded materials for answers</p>
              </div>
              <button
                onClick={() => handleSave({ strictGrounding: !activeProject.settings.strictGrounding })}
                className={`w-10 h-5 rounded-full transition-colors relative`}
                style={{ background: activeProject.settings.strictGrounding ? 'var(--accent-refs)' : 'var(--bg-base)' }}
              >
                <div 
                  className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${activeProject.settings.strictGrounding ? 'left-6' : 'left-1'}`} 
                />
              </button>
            </div>

            {/* Language */}
            <div className="space-y-3">
              <label className="text-xs font-medium uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                <Globe size={14} style={{ color: 'var(--text-tertiary)' }} />
                Output Language
              </label>
              <select
                value={activeProject.settings.language}
                onChange={(e) => handleSave({ language: e.target.value })}
                className="w-full p-3 rounded-xl bg-transparent border outline-none text-sm"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
              </select>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-[10px] text-center uppercase tracking-tighter" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              Project ID: {activeProject.id}
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
