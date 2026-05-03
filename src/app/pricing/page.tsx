import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PricingCards } from '@/components/sections/PricingCards';
import { BackButton } from '@/components/ui/BackButton';

export default async function PricingPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  return (
    <div
      className="min-h-screen px-6 py-16 relative"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <BackButton className="absolute top-6 left-6" />
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1
          className="text-3xl font-medium mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Simple, transparent pricing
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Choose the plan that fits your research. Upgrade to Pro for unlimited projects, more files, and priority retrieval.
        </p>
      </div>

      <PricingCards currentPlan="free" />
    </div>
  );
}