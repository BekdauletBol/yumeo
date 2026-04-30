import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PricingCards } from '@/components/sections/PricingCards';

export default async function PricingPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  return (
    <div
      className="min-h-screen px-6 py-16 relative"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <Link
        href="/projects/new"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm transition-colors hover:opacity-80"
        style={{ color: 'var(--text-secondary)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </Link>
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1
          className="text-3xl font-medium mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Simple, transparent pricing
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Upgrade to Pro for unlimited projects, larger files, and Claude Opus.
        </p>
      </div>

      <PricingCards currentPlan="free" />
    </div>
  );
}