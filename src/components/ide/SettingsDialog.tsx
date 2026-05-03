import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Settings, Shield, Zap, Globe, Key } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { updateProjectAction } from '@/app/actions/projects';
import { saveClaudeKeyAction, hasClaudeKeyAction } from '@/app/actions/settings';
import { showToast } from '@/lib/utils/toast';

export function SettingsDialog() {
  const { activeProject, setActiveProject } = useProjectStore();
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  useEffect(() => {
    if (open) {
      hasClaudeKeyAction().then(setHasKey);
    }
  }, [open]);

  if (!activeProject) return null;

  const handleSaveSettings = async (updates: Partial<typeof activeProject.settings>) => {
    try {
      const newSettings = { ...activeProject.settings, ...updates };
      const updatedProject = { ...activeProject, settings: newSettings };
      await updateProjectAction(activeProject.id, { settings: newSettings });
      setActiveProject(updatedProject);
      showToast('Settings saved successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      console.error('[settings] Save failed:', err);
      showToast(msg);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey) {
      showToast('Please enter an API key first');
      return;
    }
    setIsSavingKey(true);
    try {
      await saveClaudeKeyAction(apiKey);
      setHasKey(true);
      setApiKey('');
      showToast('API key saved successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save API key';
      showToast(msg);
      console.error('[settings] Save key failed:', err);
    } finally {
      setIsSavingKey(false);
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
              Settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded hover:bg-white/10" style={{ color: 'var(--text-tertiary)' }}>
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* API Key Section */}
            <div className="space-y-3">
              <label className="text-xs font-medium uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                <Key size={14} style={{ color: hasKey ? 'var(--status-success)' : 'var(--status-error)' }} />
                Anthropic API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasKey ? '••••••••••••••••' : 'sk-ant-api03-...'}
                  className="flex-1 p-2.5 rounded-xl bg-transparent border outline-none text-sm"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                />
                <button
                  onClick={handleSaveKey}
                  disabled={!apiKey || isSavingKey}
                  className="px-4 py-2 rounded-xl text-xs font-medium transition-all bg-white text-black hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingKey ? 'Saving...' : 'Save'}
                </button>
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                {hasKey ? '✓ Your key is configured.' : 'Add your key to enable AI features.'} Keys are stored securely.
              </p>
            </div>

            <div className="h-px" style={{ background: 'var(--border-subtle)' }} />

            {/* Model Selection */}
            <div className="space-y-3">
              <label className="text-xs font-medium uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                <Zap size={14} style={{ color: 'var(--accent-refs)' }} />
                AI Intelligence (GitHub Models)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(
                  [
                    { id: 'gpt-4o', label: 'GPT-4o', desc: 'Fastest & most capable for research' },
                    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', desc: 'Reliable academic reasoning' },
                    { id: 'o1-preview', label: 'o1 Preview', desc: 'Deep logical processing' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSaveSettings({ agentModel: m.id })}
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
                onClick={() => handleSaveSettings({ strictGrounding: !activeProject.settings.strictGrounding })}
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
                onChange={(e) => handleSaveSettings({ language: e.target.value })}
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
