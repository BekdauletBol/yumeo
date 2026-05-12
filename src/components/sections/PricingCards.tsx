'use client';

import { useState } from 'react';
import { Check, Zap, BookOpen } from 'lucide-react';
import { PLANS } from '@/lib/stripe/plans';
import { cn } from '@/lib/utils/cn';

interface PricingCardsProps {
  currentPlan?: 'free' | 'pro';
  onUpgrade?: () => Promise<void>;
}

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
    <div className="flex flex-col md:flex-row gap-5 max-w-3xl mx-auto p-4">
      <PricingCard
        planKey="free"
        name="community"
        price={0}
        features={PLANS.free.features}
        isCurrent={currentPlan === 'free'}
        icon={<BookOpen size={20} />}
        cta={currentPlan === 'free' ? 'current plan' : 'downgrade'}
        ctaDisabled
      />

      <PricingCard
        planKey="pro"
        name="researcher"
        price={PLANS.pro.price}
        features={PLANS.pro.features}
        isCurrent={currentPlan === 'pro'}
        icon={<Zap size={20} />}
        cta={
          currentPlan === 'pro'
            ? 'active subscription'
            : isLoading
              ? 'connecting...'
              : 'upgrade to pro'
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
  cta: string;
  ctaDisabled?: boolean;
  onCta?: () => void;
  highlighted?: boolean;
}

function PricingCard({
  name, price, features, isCurrent, icon, cta, ctaDisabled, onCta, highlighted,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "flex-1 rounded-xl p-7 flex flex-col transition-all duration-200 border",
        highlighted 
          ? "border-accent-primary shadow-sm hover:scale-[1.01]" 
          : "border-border-subtle hover:border-border-default"
      )}
      style={{ background: 'var(--bg-surface)' }}
    >
      <div className="mb-7">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center mb-4 border",
          highlighted ? "border-accent-primary/20 text-accent-primary" : "border-border-subtle text-text-secondary"
        )} style={{ background: 'var(--bg-elevated)' }}>
          {icon}
        </div>
        <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
          {name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)', letterSpacing: '-0.02em' }}>
            ${price}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
            / month
          </span>
        </div>
      </div>

      <ul className="flex-1 space-y-3 mb-8" role="list">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check size={14} className={cn("mt-0.5 shrink-0", highlighted ? "text-accent-primary" : "text-text-tertiary")} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onCta}
        disabled={ctaDisabled || !onCta}
        className={cn(
          "w-full py-3 px-6 rounded-lg text-sm font-medium transition-all",
          highlighted && !ctaDisabled
            ? "bg-accent-primary text-white hover:opacity-90"
            : "border cursor-not-allowed"
        )}
        style={
          highlighted && !ctaDisabled
            ? { fontFamily: 'var(--font-body)' }
            : { background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', borderColor: 'var(--border-subtle)', fontFamily: 'var(--font-body)' }
        }
      >
        {cta}
      </button>
    </div>
  );
}