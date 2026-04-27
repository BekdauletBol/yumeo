'use client';

import { useState } from 'react';
import { Check, Zap, BookOpen } from 'lucide-react';
import { PLANS } from '@/lib/stripe/plans';

interface PricingCardsProps {
  currentPlan?: 'free' | 'pro';
  onUpgrade?: () => Promise<void>;
}

/**
 * Side-by-side pricing cards for Free and Pro plans.
 */
export function PricingCards({ currentPlan = 'free', onUpgrade }: PricingCardsProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpgrade() {
    if (!onUpgrade) return;
    setIsLoading(true);
    try {
      await onUpgrade();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
      {/* Free plan */}
      <PricingCard
        planKey="free"
        name="Free"
        price={0}
        features={PLANS.free.features}
        isCurrent={currentPlan === 'free'}
        icon={<BookOpen size={20} aria-hidden="true" />}
        accentColor="var(--accent-refs)"
        cta={currentPlan === 'free' ? 'Current plan' : 'Downgrade'}
        ctaDisabled
      />

      {/* Pro plan */}
      <PricingCard
        planKey="pro"
        name="Pro"
        price={PLANS.pro.price}
        features={PLANS.pro.features}
        isCurrent={currentPlan === 'pro'}
        icon={<Zap size={20} aria-hidden="true" />}
        accentColor="var(--text-accent)"
        cta={
          currentPlan === 'pro'
            ? 'Current plan'
            : isLoading
              ? 'Redirecting…'
              : 'Upgrade to Pro'
        }
        ctaDisabled={currentPlan === 'pro'}
        onCta={currentPlan !== 'pro' ? () => void handleUpgrade() : undefined}
        highlighted
      />
    </div>
  );
}

interface PricingCardProps {
  planKey: 'free' | 'pro';
  name: string;
  price: number;
  features: readonly string[];
  isCurrent: boolean;
  icon: React.ReactNode;
  accentColor: string;
  cta: string;
  ctaDisabled?: boolean;
  onCta?: () => void;
  highlighted?: boolean;
}

function PricingCard({
  name, price, features, isCurrent, icon, accentColor, cta, ctaDisabled, onCta, highlighted,
}: PricingCardProps) {
  return (
    <div
      className="flex-1 rounded-xl p-6 flex flex-col"
      style={{
        background: highlighted ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border: `1px solid ${highlighted ? accentColor + '40' : 'var(--border-default)'}`,
        boxShadow: highlighted ? `0 0 0 1px ${accentColor}20, 0 8px 32px rgba(0,0,0,0.3)` : 'none',
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          {icon}
        </div>
        <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          {name}
        </h3>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            ${price}
          </span>
          {price > 0 && (
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              / month
            </span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-2 mb-6" role="list">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check size={14} className="mt-0.5 shrink-0" style={{ color: accentColor }} aria-hidden="true" />
            <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onCta}
        disabled={ctaDisabled || !onCta}
        aria-label={cta}
        className="w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
        style={{
          background: isCurrent || ctaDisabled ? 'var(--bg-overlay)' : accentColor,
          color: isCurrent || ctaDisabled ? 'var(--text-tertiary)' : '#000',
          cursor: ctaDisabled ? 'not-allowed' : 'pointer',
          opacity: ctaDisabled ? 0.6 : 1,
        }}
      >
        {cta}
      </button>
    </div>
  );
}