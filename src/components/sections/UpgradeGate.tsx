'use client';

import { Lock, Zap } from 'lucide-react';
import Link from 'next/link';

interface UpgradeGateProps {
  feature: string;
  reason: string;
  plan?: 'free' | 'pro';
  children?: React.ReactNode;
}

/**
 * Wraps a feature that requires Pro, showing a lock overlay for free users.
 * Pass `plan="pro"` to render children directly.
 */
export function UpgradeGate({ feature, reason, plan = 'free', children }: UpgradeGateProps) {
  if (plan === 'pro') {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred children preview */}
      {children && (
        <div className="pointer-events-none select-none" style={{ filter: 'blur(3px)', opacity: 0.4 }}>
          {children}
        </div>
      )}

      {/* Gate overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center p-4 rounded-lg text-center"
        style={{
          background: 'rgba(13,15,18,0.85)',
          backdropFilter: 'blur(4px)',
        }}
        role="status"
        aria-label={`${feature} requires Pro plan`}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
          style={{ background: 'rgba(240,185,74,0.15)', border: '1px solid rgba(240,185,74,0.3)' }}
          aria-hidden="true"
        >
          <Lock size={16} style={{ color: 'var(--text-accent)' }} />
        </div>

        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          {feature}
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          {reason}
        </p>

        <Link
          href="/pricing"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: 'var(--text-accent)', color: '#000' }}
          aria-label="Upgrade to Pro"
        >
          <Zap size={13} aria-hidden="true" />
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}