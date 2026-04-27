'use client';

import { Zap } from 'lucide-react';

interface PlanBadgeProps {
  plan?: 'free' | 'pro';
  className?: string;
}

/**
 * Compact plan badge displayed in the TopBar.
 * Clicking navigates to pricing/upgrade.
 */
export function PlanBadge({ plan = 'free', className }: PlanBadgeProps) {
  if (plan === 'pro') {
    return (
      <span
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${className ?? ''}`}
        style={{
          background: 'rgba(240,185,74,0.15)',
          color: 'var(--text-accent)',
          border: '1px solid rgba(240,185,74,0.3)',
          fontFamily: 'var(--font-mono)',
        }}
        aria-label="Pro plan"
      >
        <Zap size={10} aria-hidden="true" />
        PRO
      </span>
    );
  }

  return (
    <a
      href="/pricing"
      className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-opacity hover:opacity-80 ${className ?? ''}`}
      style={{
        background: 'var(--bg-elevated)',
        color: 'var(--text-tertiary)',
        border: '1px solid var(--border-subtle)',
        fontFamily: 'var(--font-mono)',
      }}
      aria-label="Free plan — upgrade to Pro"
    >
      FREE
    </a>
  );
}