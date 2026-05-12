'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { ArrowRight, Shield, BookOpen, FileText, Zap, Check } from 'lucide-react';

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [phase, setPhase] = useState<'black' | 'reveal' | 'ready'>('black');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      const timer = setTimeout(() => setPhase('reveal'), 600);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (phase === 'reveal') {
      const timer = setTimeout(() => setPhase('ready'), 500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleEnter = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => router.push('/sign-in'), 400);
  }, [router]);

  useEffect(() => {
    if (isLoaded && !user) {
      const handler = (e: KeyboardEvent) => { if (e.key === 'Enter') handleEnter(); };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [isLoaded, user, handleEnter]);

  if (!isLoaded) return <div className="fixed inset-0" style={{ background: 'var(--bg-base)' }} />;

  // ── Authenticated → Dashboard ─────────────────────────────
  if (user) return <DashboardView />;

  // ── Landing page ──────────────────────────────────────────
  return (
    <div
      className={`fixed inset-0 overflow-y-auto transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: '#0a0a0a', color: '#e5e5e5' }}
    >
      {/* ── Hero section ────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 md:px-16 py-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#E8611A' }}>
            <span className="text-white font-bold text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>y</span>
          </div>
          <span className="text-base font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>yumeo</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <button onClick={() => {}} className="text-sm transition-colors hover:text-white" style={{ color: '#888', fontFamily: 'Inter, sans-serif' }}>features</button>
          <button onClick={() => router.push('/docs')} className="text-sm transition-colors hover:text-white" style={{ color: '#888', fontFamily: 'Inter, sans-serif' }}>docs</button>
          <button onClick={() => router.push('/pricing')} className="text-sm transition-colors hover:text-white" style={{ color: '#888', fontFamily: 'Inter, sans-serif' }}>pricing</button>
          <button
            onClick={handleEnter}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:opacity-90"
            style={{ background: '#E8611A', color: 'white', fontFamily: 'Inter, sans-serif' }}
          >
            get started
          </button>
        </nav>
        <button
          onClick={handleEnter}
          className="md:hidden text-sm font-medium px-4 py-2 rounded-lg"
          style={{ background: '#E8611A', color: 'white', fontFamily: 'Inter, sans-serif' }}
        >
          get started
        </button>
      </header>

      <main>
        {/* Hero */}
        <section 
          className={`px-8 md:px-16 pt-20 md:pt-32 pb-24 md:pb-40 transition-all duration-700 ease-out ${
            phase === 'black' ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="max-w-3xl">
            <h1
              className="text-4xl md:text-6xl font-medium leading-[1.1] mb-6"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.03em', color: '#f0f0f0' }}
            >
              research without
              <br />
              hallucination.
            </h1>
            <p
              className="text-base md:text-lg leading-relaxed mb-10 max-w-lg"
              style={{ fontFamily: 'Inter, sans-serif', color: '#777' }}
            >
              upload your papers. ask questions. write reports.
              <br />
              every AI answer is strictly grounded in your materials.
              <br />
              no made-up sources. no fake citations. ever.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleEnter}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-all hover:opacity-90"
                style={{ background: '#E8611A', color: 'white', fontFamily: 'Inter, sans-serif' }}
              >
                start researching <ArrowRight size={16} />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-all hover:opacity-80"
                style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ccc', fontFamily: 'Inter, sans-serif' }}
              >
                see how it works
              </button>
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────── */}
        <section 
          id="features"
          className={`px-8 md:px-16 py-24 transition-all duration-700 delay-200 ${
            phase === 'black' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ borderTop: '1px solid #1a1a1a' }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-24">
              {[
                { icon: BookOpen, title: 'grounded answers', desc: 'every response traces back to your uploaded PDFs, papers, and notes. nothing invented.' },
                { icon: Shield, title: 'citation integrity', desc: 'automatic source verification. every claim shows exactly where it came from.' },
                { icon: FileText, title: 'export anywhere', desc: 'generate publication-ready reports in DOCX or PDF. properly formatted, properly cited.' },
              ].map((f) => (
                <div key={f.title} className="space-y-3">
                  <f.icon size={20} style={{ color: '#E8611A' }} />
                  <h3 className="text-lg font-medium" style={{ fontFamily: 'Inter, sans-serif', color: '#f0f0f0' }}>
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif', color: '#777' }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="max-w-2xl">
              <h2
                className="text-3xl md:text-4xl font-medium leading-tight mb-6"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em', color: '#f0f0f0' }}
              >
                it remembers
                <br />
                your research.
              </h2>
              <p className="text-sm leading-relaxed mb-8" style={{ fontFamily: 'Inter, sans-serif', color: '#777' }}>
                every paper you upload, every question you ask, every draft you write.
                yumeo builds a knowledge graph from your materials and uses it to
                give you answers you can trust.
              </p>
              <div className="space-y-3">
                {[
                  'upload PDFs, DOCX, BibTeX — we parse everything',
                  'AI reads only your materials, never the open web',
                  'export verified reports with proper citations',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Check size={16} style={{ color: '#E8611A' }} />
                    <span className="text-sm" style={{ fontFamily: 'Inter, sans-serif', color: '#aaa' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <section 
          className="px-8 md:px-16 py-24 text-center"
          style={{ borderTop: '1px solid #1a1a1a' }}
        >
          <h2
            className="text-2xl md:text-3xl font-medium mb-4"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em', color: '#f0f0f0' }}
          >
            ready to write with confidence?
          </h2>
          <p className="text-sm mb-8" style={{ fontFamily: 'Inter, sans-serif', color: '#777' }}>
            join researchers who trust their sources.
          </p>
          <button
            onClick={handleEnter}
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium rounded-lg transition-all hover:opacity-90"
            style={{ background: '#E8611A', color: 'white', fontFamily: 'Inter, sans-serif' }}
          >
            get started free <ArrowRight size={16} />
          </button>
        </section>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="px-8 md:px-16 py-8" style={{ borderTop: '1px solid #1a1a1a' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: '#E8611A' }}>
                <span className="text-white text-[10px] font-bold">y</span>
              </div>
              <span className="text-xs" style={{ fontFamily: 'Inter, sans-serif', color: '#555' }}>
                yumeo — research IDE
              </span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => router.push('/docs')} className="text-xs transition-colors hover:text-white" style={{ color: '#555', fontFamily: 'Inter, sans-serif' }}>docs</button>
              <button onClick={() => router.push('/pricing')} className="text-xs transition-colors hover:text-white" style={{ color: '#555', fontFamily: 'Inter, sans-serif' }}>pricing</button>
              <span className="text-xs" style={{ color: '#333', fontFamily: 'Inter, sans-serif' }}>© 2026</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
