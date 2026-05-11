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
    <div className="flex flex-col md:flex-row gap-6 max-w-3xl mx-auto p-4">
      <PricingCard
        planKey="free"
        name="Community"
        price={0}
        features={PLANS.free.features}
        isCurrent={currentPlan === 'free'}
        icon={<BookOpen size={20} />}
        cta={currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
        ctaDisabled
      />

      <PricingCard
        planKey="pro"
        name="Researcher"
        price={PLANS.pro.price}
        features={PLANS.pro.features}
        isCurrent={currentPlan === 'pro'}
        icon={<Zap size={20} />}
        cta={
          currentPlan === 'pro'
            ? 'Active Subscription'
            : isLoading
              ? 'Connecting Stripe...'
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
        "flex-1 rounded-2xl p-8 flex flex-col transition-all duration-200 border",
        highlighted 
          ? "bg-bg-surface border-accent-primary shadow-sm hover:scale-[1.02]" 
          : "bg-bg-surface border-border-subtle hover:border-border-default"
      )}
    >
      <div className="mb-8">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4 border",
          highlighted ? "bg-accent-primary/10 border-accent-primary/20 text-accent-primary" : "bg-bg-elevated border-border-subtle text-text-secondary"
        )}>
          {icon}
        </div>
        <h3 className="text-sm font-mono font-bold uppercase tracking-[0.2em] text-text-primary mb-1">
          {name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-mono font-bold text-text-primary tracking-tighter">
            ${price}
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-tertiary">
            / Month
          </span>
        </div>
      </div>

      <ul className="flex-1 space-y-4 mb-10" role="list">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check size={14} className={cn("mt-0.5 shrink-0", highlighted ? "text-accent-primary" : "text-text-tertiary")} />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-tight">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onCta}
        disabled={ctaDisabled || !onCta}
        className={cn(
          "w-full py-4 px-6 rounded-xl font-mono font-bold text-xs uppercase tracking-widest transition-all",
          highlighted && !ctaDisabled
            ? "bg-accent-primary text-white hover:opacity-90"
            : "bg-bg-elevated text-text-tertiary border border-border-subtle cursor-not-allowed"
        )}
      >
        {cta}
      </button>
    </div>
  );
}