'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { DashboardView } from '@/components/dashboard/DashboardView';

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [phase, setPhase] = useState<'black' | 'reveal' | 'ready'>('black');
  const [fadeOut, setFadeOut] = useState(false);

  // Landing page phases — 800ms pure black, then reveal
  useEffect(() => {
    if (isLoaded && !user) {
      const timer = setTimeout(() => setPhase('reveal'), 800);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (phase === 'reveal') {
      const timer = setTimeout(() => setPhase('ready'), 600);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleEnter = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => router.push('/sign-in'), 400);
  }, [router]);

  // Enter key listener (landing only)
  useEffect(() => {
    if (isLoaded && !user) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Enter') handleEnter();
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [isLoaded, user, handleEnter]);

  // Loading
  if (!isLoaded) return <div className="fixed inset-0 bg-black" />;

  // ─── Authenticated → Dashboard ──────────────────────────────
  if (user) {
    return <DashboardView />;
  }

  // ─── Unauthenticated → Landing (Nozomio-style split screen) ─
  return (
    <div
      className={`fixed inset-0 bg-black flex transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleEnter}
      style={{ cursor: 'pointer' }}
    >
      {/* Left half: Art image */}
      <div
        className={`w-1/2 h-full relative overflow-hidden transition-all duration-700 ease-out ${
          phase === 'black' ? 'opacity-0 -translate-x-5' : 'opacity-100 translate-x-0'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing-art.png"
          alt="YUMEO"
          className="w-full h-full object-cover"
        />
        {/* Gradient bleed into the right panel */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/50" />
      </div>

      {/* Right half: Text content */}
      <div
        className={`w-1/2 h-full flex flex-col justify-center px-16 transition-all duration-700 ease-out delay-200 ${
          phase === 'black' ? 'opacity-0 translate-x-5' : 'opacity-100 translate-x-0'
        }`}
        style={{ background: '#1a1a1a' }}
      >
        <div className="max-w-md">
          {/* Brand */}
          <h1
            className="text-4xl font-bold tracking-[0.3em] uppercase mb-2"
            style={{ fontFamily: 'var(--font-mono)', color: '#F0F0F0' }}
          >
            YUMEO
          </h1>
          <p
            className="text-sm tracking-[0.15em] uppercase mb-10"
            style={{ fontFamily: 'var(--font-mono)', color: '#555' }}
          >
            / research IDE /
          </p>

          {/* Description */}
          <p
            className="text-sm leading-7 mb-8"
            style={{ fontFamily: 'var(--font-body)', color: '#888', maxWidth: 380 }}
          >
            AI workspace for writing academic papers
            without hallucinating sources.
          </p>

          {/* Steps */}
          <div className="space-y-2 mb-12">
            <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#666' }}>
              Upload references →
            </p>
            <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#666' }}>
              AI writes strictly from them →
            </p>
            <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#666' }}>
              Export verified report.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={(e) => { e.stopPropagation(); handleEnter(); }}
            className="group flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
            style={{ fontFamily: 'var(--font-mono)', color: '#E8611A' }}
          >
            Press Enter to continue
            <span className="inline-block w-[2px] h-[14px] bg-[#E8611A] animate-pulse" />
          </button>
        </div>
      </div>
    </div>
  );
}
