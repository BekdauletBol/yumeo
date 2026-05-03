'use client';

import { PLANS } from '@/lib/stripe/plans';

interface UsageMeterProps {
  plan?: 'free' | 'pro';
  currentFiles: number;
  currentProjects: number;
}

/**
 * Visual usage meter showing file and project consumption vs plan limits.
 */
export function UsageMeter({ plan = 'free', currentFiles, currentProjects }: UsageMeterProps) {
  const limits = PLANS[plan];
  const filePercent = Math.min((currentFiles / limits.maxFilesPerProject) * 100, 100);
  const projectPercent = limits.maxProjects === -1 ? 0 : Math.min((currentProjects / limits.maxProjects) * 100, 100);

  const fileColor = filePercent >= 90 ? 'var(--status-error)' : filePercent >= 70 ? 'var(--status-warning)' : 'var(--accent-refs)';

  return (
    <div className="space-y-3 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
      <p className="text-section-label">Usage</p>

      {/* Files in project */}
      <div>
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
          <span>Files in project</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: fileColor }}>
            {currentFiles} / {limits.maxFilesPerProject}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${filePercent}%`, background: fileColor }}
            role="progressbar"
            aria-valuenow={currentFiles}
            aria-valuemin={0}
            aria-valuemax={limits.maxFilesPerProject}
            aria-label="Files used"
          />
        </div>
      </div>

      {/* Projects */}
      <div>
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
          <span>Projects</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {currentProjects} / {limits.maxProjects === -1 ? '∞' : limits.maxProjects}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${projectPercent}%`, background: 'var(--accent-drafts)' }}
            role="progressbar"
            aria-valuenow={currentProjects}
            aria-valuemin={0}
            aria-valuemax={limits.maxProjects}
            aria-label="Projects used"
          />
        </div>
      </div>
    </div>
  );
}