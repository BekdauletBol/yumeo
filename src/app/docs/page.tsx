import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Upload,
  MessageSquare,
  Download,
  Zap,
  ArrowLeft,
  Mail,
  ChevronRight,
  CheckCircle2,
  Github,
  Layout,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'documentation — yumeo research IDE',
  description:
    'learn how to use yumeo: upload references, chat with AI grounded in your materials, and export your research report.',
};

const CONTACT_EMAIL = 'yumeo.lab@gmail.com';
const font = 'var(--font-body)';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'upload your references',
    description:
      'start by dragging any file directly onto the workspace, or click the upload area in the onboarding panel.',
    formats: ['PDF papers and articles', 'DOCX / Word documents', 'Markdown (.md) notes', 'BibTeX (.bib) files', 'plain text (.txt)', 'CSV data tables', 'images (PNG, JPG) — auto-described by AI'],
    tip: 'you can upload multiple files at once. yumeo reads the full content of each file and makes it available to the AI.',
  },
  {
    number: '02',
    icon: MessageSquare,
    title: 'chat with your materials',
    description:
      'once at least one reference is uploaded, the chat interface appears. every AI answer is grounded exclusively in your uploaded materials — no hallucinations.',
    formats: [
      '"summarize the key findings of the uploaded paper"',
      '"what methodology does [paper name] use?"',
      '"compare the results across the uploaded studies"',
      '"extract all statistics from the tables"',
      '"draft an introduction based on my references"',
    ],
    tip: 'the AI can only see what you\'ve uploaded. if you ask about something not in your materials, it will tell you.',
  },
  {
    number: '03',
    icon: Layout,
    title: 'use the right panel',
    description:
      'the right panel has specialized tabs for different types of content in your research workflow.',
    formats: [
      'references — view and manage uploaded files',
      'figures — organize images and charts',
      'tables — manage extracted data tables',
      'templates — fill structured report templates',
      'diagrams — create flowcharts with mermaid',
      'equations — write and preview LaTeX math',
    ],
    tip: 'each tab shows a count badge when it has content. click any tab to open the corresponding tool.',
  },
  {
    number: '04',
    icon: Download,
    title: 'export your report',
    description:
      'when you have a draft ready, export it in your preferred format from the templates tab.',
    formats: ['DOCX — Microsoft Word compatible', 'LaTeX — ready for journal submission', 'PDF — via browser print dialog', 'Markdown — for static sites or GitHub'],
    tip: 'use templates to structure your draft before exporting. they guide the AI to produce report-ready content.',
  },
];

const faqs = [
  {
    q: 'can the AI access the internet or my other files?',
    a: 'no. the AI is strictly grounded in the files you upload. it cannot browse the web, access your local file system, or see files from other projects.',
  },
  {
    q: 'what is the file size limit?',
    a: 'free plan: 25 MB per file. pro plan: 100 MB per file.',
  },
  {
    q: 'which AI model does yumeo use?',
    a: 'yumeo uses state-of-the-art models to deliver fast, accurate responses grounded exclusively in your uploaded materials.',
  },
  {
    q: 'is my data private?',
    a: 'yes. your uploaded files and chat history are stored in your personal workspace and are never shared or used to train AI models.',
  },
  {
    q: 'why does the AI say "I cannot find this in your materials"?',
    a: 'this is by design. yumeo prevents the AI from guessing. if the information isn\'t in your files, it will tell you honestly rather than hallucinate.',
  },
  {
    q: 'can I use yumeo for non-academic writing?',
    a: 'absolutely. yumeo works for any research-based writing: market research, technical docs, legal analysis, journalism, and more.',
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 h-14 flex items-center px-6 md:px-10 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--border-subtle)', background: 'color-mix(in srgb, var(--bg-base) 85%, transparent)' }}
      >
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-tertiary)', fontFamily: font }}
            >
              <ArrowLeft size={14} />
              back
            </Link>
            <span style={{ color: 'var(--border-default)' }}>·</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
                <span className="text-white font-bold text-[11px]" style={{ fontFamily: font }}>y</span>
              </div>
              <span className="text-sm font-semibold" style={{ fontFamily: font }}>
                yumeo docs
              </span>
            </div>
          </div>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontFamily: font,
            }}
          >
            <Mail size={12} />
            contact
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 md:px-10 py-16 space-y-20">
        {/* Hero */}
        <section className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: 'var(--accent-primary)', fontFamily: font }}>
              documentation
            </p>
            <h1
              className="text-3xl md:text-4xl font-medium leading-tight"
              style={{ fontFamily: font, letterSpacing: '-0.02em' }}
            >
              how to use yumeo
            </h1>
          </div>
          <p className="text-base max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: font }}>
            yumeo is a research IDE — a structured workspace where every AI response is grounded
            exclusively in your own uploaded materials. no hallucinations. no open-web browsing.
            just your research, powered by AI.
          </p>

          {/* Quick links */}
          <div className="flex flex-wrap gap-2">
            {['getting started', 'chat tips', 'right panel', 'export', 'FAQ'].map((label, i) => (
              <a
                key={label}
                href={`#section-${i}`}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontFamily: font,
                }}
              >
                {label}
                <ChevronRight size={10} />
              </a>
            ))}
          </div>
        </section>

        {/* Step-by-step guide */}
        <section className="space-y-12">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                id={`section-${i}`}
                className="grid md:grid-cols-[1fr_1.4fr] gap-8 items-start"
              >
                {/* Left column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-2xl font-medium"
                      style={{ color: 'var(--accent-primary)', fontFamily: font }}
                    >
                      {step.number}
                    </span>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    >
                      <Icon size={16} style={{ color: 'var(--accent-primary)' }} />
                    </div>
                  </div>
                  <h2
                    className="text-xl font-medium"
                    style={{ fontFamily: font }}
                  >
                    {step.title}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: font }}>
                    {step.description}
                  </p>

                  {/* Tip box */}
                  <div
                    className="p-3 rounded-lg text-xs leading-relaxed"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontFamily: font,
                    }}
                  >
                    <span className="font-medium" style={{ color: 'var(--accent-primary)' }}>tip · </span>
                    {step.tip}
                  </div>
                </div>

                {/* Right column — list */}
                <div
                  className="p-5 rounded-xl space-y-2"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <p
                    className="text-xs font-medium mb-3"
                    style={{ color: 'var(--text-tertiary)', fontFamily: font }}
                  >
                    {i === 0 ? 'supported formats' : i === 1 ? 'example prompts' : i === 2 ? 'available tabs' : 'export formats'}
                  </p>
                  {step.formats.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2
                        size={13}
                        className="shrink-0 mt-0.5"
                        style={{ color: 'var(--accent-primary)' }}
                      />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: font }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Model info banner */}
        <section
          className="p-6 rounded-xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
            >
              <Zap size={18} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium" style={{ fontFamily: font }}>
                powered by state-of-the-art AI
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: font }}>
                the AI only has access to the materials you upload — it cannot browse the internet
                or access any external data source. your research stays private.
              </p>
              <a
                href="https://github.com/marketplace/models"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs mt-2 transition-opacity hover:opacity-70"
                style={{ color: 'var(--accent-primary)', fontFamily: font }}
              >
                <Github size={12} />
                GitHub Models marketplace
                <ChevronRight size={10} />
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="section-4" className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: 'var(--accent-primary)', fontFamily: font }}>
              FAQ
            </p>
            <h2
              className="text-2xl font-medium"
              style={{ fontFamily: font, letterSpacing: '-0.01em' }}
            >
              frequently asked questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="p-5 rounded-xl"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                <p className="text-sm font-medium mb-2" style={{ fontFamily: font }}>{faq.q}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: font }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section
          className="p-8 rounded-xl text-center space-y-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
          >
            <Mail size={20} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-medium" style={{ fontFamily: font }}>
              have a question?
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: font }}>
              we&apos;re here to help researchers get the most out of yumeo.
            </p>
          </div>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent-primary)', color: '#fff', fontFamily: font }}
          >
            <Mail size={14} />
            {CONTACT_EMAIL}
          </a>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: font }}>
            we aim to respond within 24 hours.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="border-t mt-16 px-6 md:px-10 py-8"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
              <span className="text-white text-[10px] font-bold">y</span>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: font }}>
              yumeo — research IDE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs transition-opacity hover:opacity-70" style={{ color: 'var(--text-tertiary)', fontFamily: font }}>
              dashboard
            </Link>
            <Link href="/pricing" className="text-xs transition-opacity hover:opacity-70" style={{ color: 'var(--text-tertiary)', fontFamily: font }}>
              pricing
            </Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-xs transition-opacity hover:opacity-70" style={{ color: 'var(--text-tertiary)', fontFamily: font }}>
              contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
