'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { ArrowRight, Shield, BookOpen, FileText, Check, Upload, MessageSquare, Download } from 'lucide-react';

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

  if (!isLoaded) return <div className="fixed inset-0" style={{ background: '#0a0a0a' }} />;
  if (user) return <DashboardView />;

  const font = 'Inter, system-ui, sans-serif';

  return (
    <div
      className={`fixed inset-0 overflow-y-auto transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: '#0a0a0a', color: '#e5e5e5' }}
    >
      {/* ── Navbar ────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 md:px-16 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#E8611A' }}>
            <span className="text-white font-bold text-sm" style={{ fontFamily: font }}>y</span>
          </div>
          <span className="text-base font-semibold" style={{ fontFamily: font }}>yumeo</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm transition-colors hover:text-white" style={{ color: '#888', fontFamily: font }}>features</button>
          <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm transition-colors hover:text-white" style={{ color: '#888', fontFamily: font }}>how it works</button>
          <button onClick={() => router.push('/docs')} className="text-sm transition-colors hover:text-white" style={{ color: '#888', fontFamily: font }}>docs</button>
          <button onClick={() => router.push('/pricing')} className="text-sm transition-colors hover:text-white" style={{ color: '#888', fontFamily: font }}>pricing</button>
          <button
            onClick={handleEnter}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:opacity-90"
            style={{ background: '#E8611A', color: 'white', fontFamily: font }}
          >
            get started
          </button>
        </nav>
        <button
          onClick={handleEnter}
          className="md:hidden text-sm font-medium px-4 py-2 rounded-lg"
          style={{ background: '#E8611A', color: 'white', fontFamily: font }}
        >
          get started
        </button>
      </header>

      <main>
        {/* ── Hero with art ──────────────────────────────────── */}
        <section
          className={`relative transition-all duration-700 ease-out ${phase === 'black' ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
            }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 min-h-[85vh]">
            {/* Left — text */}
            <div className="flex flex-col justify-center px-8 md:px-16 py-16 md:py-0">
              <div className="max-w-lg">
                <h1
                  className="text-4xl md:text-[3.5rem] font-medium leading-[1.08] mb-6"
                  style={{ fontFamily: font, letterSpacing: '-0.03em', color: '#f0f0f0' }}
                >
                  research without
                  <br />
                  hallucination.
                </h1>
                <p
                  className="text-base md:text-lg leading-relaxed mb-10"
                  style={{ fontFamily: font, color: '#777' }}
                >
                  upload your papers. ask questions. write reports.
                  <br />
                  every AI answer is grounded in your materials.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleEnter}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-all hover:opacity-90"
                    style={{ background: '#E8611A', color: 'white', fontFamily: font }}
                  >
                    start researching <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-all hover:opacity-80"
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc', fontFamily: font }}
                  >
                    see how it works
                  </button>
                </div>
              </div>
            </div>

            {/* Right — art image */}
            <div className="relative hidden md:flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing-art.gif"
                alt="yumeo research visualization"
                className="w-full h-full object-cover"
                style={{ opacity: 0.85 }}
              />
              {/* Gradient bleed into left panel */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent" style={{ width: '30%' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" style={{ height: '30%', top: 'auto' }} />
            </div>
          </div>

          {/* Mobile art — shows below text on small screens */}
          <div className="md:hidden relative h-64 overflow-hidden -mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing-art.gif"
              alt="yumeo research visualization"
              className="w-full h-full object-cover"
              style={{ opacity: 0.7 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────── */}
        <section
          id="features"
          className={`px-8 md:px-16 py-24 md:py-32 transition-all duration-700 delay-200 ${phase === 'black' ? 'opacity-0' : 'opacity-100'
            }`}
          style={{ borderTop: '1px solid #161616' }}
        >
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-medium mb-4" style={{ fontFamily: font, color: '#E8611A' }}>features</p>
            <h2
              className="text-3xl md:text-4xl font-medium leading-tight mb-16"
              style={{ fontFamily: font, letterSpacing: '-0.02em', color: '#f0f0f0' }}
            >
              everything you need
              <br />
              for rigorous research.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
              {[
                { icon: BookOpen, title: 'grounded answers', desc: 'every response traces back to your uploaded PDFs, papers, and notes. no fabricated sources.' },
                { icon: Shield, title: 'citation integrity', desc: 'automatic source verification. every claim includes the exact file and page it came from.' },
                { icon: FileText, title: 'export anywhere', desc: 'generate publication-ready reports in DOCX or PDF. properly formatted and cited.' },
              ].map((f) => (
                <div key={f.title} className="space-y-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#1a1a1a', border: '1px solid #222' }}>
                    <f.icon size={18} style={{ color: '#E8611A' }} />
                  </div>
                  <h3 className="text-base font-medium" style={{ fontFamily: font, color: '#f0f0f0' }}>
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ fontFamily: font, color: '#777' }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────── */}
        <section
          id="how"
          className="px-8 md:px-16 py-24 md:py-32"
          style={{ borderTop: '1px solid #161616' }}
        >
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-medium mb-4" style={{ fontFamily: font, color: '#E8611A' }}>how it works</p>
            <h2
              className="text-3xl md:text-4xl font-medium leading-tight mb-16"
              style={{ fontFamily: font, letterSpacing: '-0.02em', color: '#f0f0f0' }}
            >
              three steps to
              <br />
              trusted research.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { step: '01', icon: Upload, title: 'upload', desc: 'drag PDFs, DOCX, BibTeX, Markdown, or images. yumeo reads and indexes everything.' },
                { step: '02', icon: MessageSquare, title: 'ask', desc: 'chat with your materials. every answer cites the exact source. no hallucinations.' },
                { step: '03', icon: Download, title: 'export', desc: 'generate reports in DOCX or PDF with proper academic formatting and citations.' },
              ].map((s) => (
                <div key={s.step} className="relative">
                  <span className="text-5xl font-medium" style={{ fontFamily: font, color: '#1a1a1a' }}>{s.step}</span>
                  <div className="mt-4 space-y-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#1a1a1a', border: '1px solid #222' }}>
                      <s.icon size={18} style={{ color: '#E8611A' }} />
                    </div>
                    <h3 className="text-base font-medium" style={{ fontFamily: font, color: '#f0f0f0' }}>{s.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ fontFamily: font, color: '#777' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust section ──────────────────────────────────── */}
        <section
          className="px-8 md:px-16 py-24 md:py-32"
          style={{ borderTop: '1px solid #161616' }}
        >
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-medium leading-tight mb-6"
              style={{ fontFamily: font, letterSpacing: '-0.02em', color: '#f0f0f0' }}
            >
              it remembers
              <br />
              your research.
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ fontFamily: font, color: '#777' }}>
              every paper you upload, every question you ask, every draft you write.
              yumeo builds a private knowledge base and uses it to give you answers
              you can actually cite in your work.
            </p>
            <div className="space-y-3 mb-12">
              {[
                'private knowledge base · only you can access it',
                'no data used for AI training · your research stays yours',
                'works offline with local materials · no internet needed for answers',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <Check size={16} style={{ color: '#E8611A' }} />
                  <span className="text-sm" style={{ fontFamily: font, color: '#aaa' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────── */}
        <section
          className="px-8 md:px-16 py-24 text-center"
          style={{ borderTop: '1px solid #161616' }}
        >
          <h2
            className="text-2xl md:text-3xl font-medium mb-4"
            style={{ fontFamily: font, letterSpacing: '-0.02em', color: '#f0f0f0' }}
          >
            ready to write with confidence?
          </h2>
          <p className="text-sm mb-8 max-w-md mx-auto" style={{ fontFamily: font, color: '#777' }}>
            join researchers who cite real sources.
            free to start, no credit card required.
          </p>
          <button
            onClick={handleEnter}
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium rounded-lg transition-all hover:opacity-90"
            style={{ background: '#E8611A', color: 'white', fontFamily: font }}
          >
            get started free <ArrowRight size={16} />
          </button>
        </section>

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer className="px-8 md:px-16 py-8" style={{ borderTop: '1px solid #161616' }}>
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: '#E8611A' }}>
                <span className="text-white text-[10px] font-bold">y</span>
              </div>
              <span className="text-xs" style={{ fontFamily: font, color: '#555' }}>
                yumeo — research IDE
              </span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => router.push('/docs')} className="text-xs transition-colors hover:text-white" style={{ color: '#555', fontFamily: font }}>docs</button>
              <button onClick={() => router.push('/pricing')} className="text-xs transition-colors hover:text-white" style={{ color: '#555', fontFamily: font }}>pricing</button>
              <a href="mailto:yumeo.lab@gmail.com" className="text-xs transition-colors hover:text-white" style={{ color: '#555', fontFamily: font }}>contact</a>
              <span className="text-xs" style={{ color: '#333', fontFamily: font }}>© 2026</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
