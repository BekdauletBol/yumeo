import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
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
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documentation — Yumeo Research IDE',
  description:
    'Learn how to use Yumeo: upload references, chat with AI grounded in your materials, and export your research report.',
};

const CONTACT_EMAIL = 'bolatovbekdaulet4@gmail.com';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload Your References',
    color: 'var(--accent-refs)',
    description:
      'Start by dragging any file directly onto the workspace, or click "Upload references" in the onboarding panel.',
    formats: ['PDF papers and articles', 'DOCX / Word documents', 'Markdown (.md) notes', 'BibTeX (.bib) files', 'Plain text (.txt)', 'CSV data tables', 'Images (PNG, JPG) — auto-described by AI'],
    tip: 'You can upload multiple files at once. Yumeo reads the full content of each file and makes it available to the AI.',
  },
  {
    number: '02',
    icon: MessageSquare,
    title: 'Chat With Your Materials',
    color: 'var(--accent-drafts)',
    description:
      'Once at least one reference is uploaded, the chat interface appears. Every AI answer is grounded exclusively in your uploaded materials — no hallucinations from the open web.',
    formats: [
      '"Summarize the key findings of the uploaded paper"',
      '"What methodology does [paper name] use?"',
      '"Compare the results across the uploaded studies"',
      '"Extract all statistics from the tables"',
      '"Draft an introduction based on my references"',
    ],
    tip: 'The AI can only see what you\'ve uploaded. If you ask about something not in your materials, it will say so.',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Use the Right Panel',
    color: 'var(--accent-figures)',
    description:
      'The right panel has specialized tabs for different types of content in your research workflow.',
    formats: [
      'Refs — view and manage uploaded references',
      'Figs — organize figures and images',
      'Tables — manage extracted data tables',
      'Templates — fill structured report templates',
      'Mermaid — create and export flowcharts & diagrams',
      'LaTeX — write and preview mathematical equations',
    ],
    tip: 'Each tab shows a count badge when it has content. Click any tab to open the corresponding tool.',
  },
  {
    number: '04',
    icon: Download,
    title: 'Export Your Report',
    color: 'var(--accent-template)',
    description:
      'When you have a draft ready, export it in your preferred format. Export is available from the Templates tab once a draft is saved.',
    formats: ['DOCX — Microsoft Word compatible', 'LaTeX — ready for journal submission', 'PDF — via your browser print dialog', 'Markdown — for static sites or GitHub'],
    tip: 'Use the Templates tab to structure your draft before exporting. Templates guide the AI to produce report-ready content.',
  },
];

const faqs = [
  {
    q: 'Can the AI access the internet or my other files?',
    a: 'No. The AI is strictly grounded in the files you upload to the current project. It cannot browse the web, access your local file system, or see files from other projects.',
  },
  {
    q: 'What is the file size limit?',
    a: 'Each file can be up to 50 MB. There is no limit on the number of files per project.',
  },
  {
    q: 'Which AI model does Yumeo use?',
    a: 'Yumeo uses GPT-4o by default (via GitHub Models), with support for Claude Sonnet as an alternative. You can select the model in project settings.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Your uploaded files and chat history are stored in your personal workspace and are never shared with other users or used to train any AI model.',
  },
  {
    q: 'Why does the AI say "I cannot find this in your materials"?',
    a: 'This is by design. Yumeo prevents the AI from guessing or confabulating. If the information is not in your uploaded files, the AI will tell you honestly rather than hallucinate an answer.',
  },
  {
    q: 'Can I use Yumeo for non-academic writing?',
    a: 'Absolutely. Yumeo works for any research-based writing: market research reports, technical documentation, legal analysis, journalism, and more.',
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 h-12 flex items-center px-6 border-b"
        style={{ borderColor: 'var(--border-subtle)', background: 'rgba(17,17,17,0.9)', backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
            >
              <ArrowLeft size={13} />
              Back
            </Link>
            <span style={{ color: 'var(--border-default)' }}>|</span>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Yumeo" width={18} height={18} style={{ filter: 'invert(1)' }} priority />
              <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                Yumeo
              </span>
            </div>
          </div>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-70"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Mail size={11} />
            Contact
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-24">
        {/* Hero */}
        <section className="space-y-6">
          <div className="space-y-1">
            <p
              className="text-xs uppercase tracking-widest"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
            >
              Documentation
            </p>
            <h1
              className="text-4xl font-medium leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              How to use Yumeo
            </h1>
          </div>
          <p className="text-base max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Yumeo is a Research IDE — a structured workspace where every AI response is grounded
            exclusively in your own uploaded materials. No hallucinations. No open-web browsing.
            Just your research, powered by AI.
          </p>

          {/* Quick links */}
          <div className="flex flex-wrap gap-3">
            {['Getting Started', 'Chat Tips', 'Right Panel', 'Export', 'FAQ'].map((label, i) => (
              <a
                key={label}
                href={`#section-${i}`}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-70"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
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
                      className="text-3xl font-medium"
                      style={{ color: step.color, fontFamily: 'var(--font-mono)' }}
                    >
                      {step.number}
                    </span>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}
                    >
                      <Icon size={16} style={{ color: step.color }} />
                    </div>
                  </div>
                  <h2
                    className="text-xl font-medium"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                  >
                    {step.title}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {step.description}
                  </p>

                  {/* Tip box */}
                  <div
                    className="p-3 rounded-lg text-xs leading-relaxed"
                    style={{
                      background: `${step.color}08`,
                      border: `1px solid ${step.color}25`,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ color: step.color, fontFamily: 'var(--font-mono)' }}>TIP </span>
                    {step.tip}
                  </div>
                </div>

                {/* Right column — list */}
                <div
                  className="p-5 rounded-xl space-y-2"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <p
                    className="text-xs mb-3"
                    style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
                  >
                    {i === 0 ? 'Supported formats' : i === 1 ? 'Example prompts' : i === 2 ? 'Available tabs' : 'Export formats'}
                  </p>
                  {step.formats.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2
                        size={13}
                        className="shrink-0 mt-0.5"
                        style={{ color: step.color }}
                      />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
              style={{ background: 'rgba(74,158,255,0.1)', border: '1px solid rgba(74,158,255,0.25)' }}
            >
              <Zap size={18} style={{ color: 'var(--accent-refs)' }} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Powered by GitHub Models · GPT-4o
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Yumeo uses GPT-4o via the GitHub Models API — the same frontier model used by
                researchers worldwide. The model only has access to the materials you upload; it
                cannot browse the internet or access any external data source.
              </p>
              <a
                href="https://github.com/marketplace/models"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs mt-2 transition-opacity hover:opacity-70"
                style={{ color: 'var(--accent-refs)', fontFamily: 'var(--font-mono)' }}
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
          <div className="space-y-1">
            <p
              className="text-xs uppercase tracking-widest"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
            >
              FAQ
            </p>
            <h2
              className="text-2xl font-medium"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="p-5 rounded-xl"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  {faq.q}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section
          className="p-8 rounded-xl text-center space-y-4"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(74,158,255,0.1)', border: '1px solid rgba(74,158,255,0.25)' }}
          >
            <Mail size={20} style={{ color: 'var(--accent-refs)' }} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-medium" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Have a question?
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              We&apos;re here to help researchers get the most out of Yumeo.
            </p>
          </div>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: 'var(--accent-refs)',
              color: '#fff',
            }}
          >
            <Mail size={14} />
            {CONTACT_EMAIL}
          </a>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            We aim to respond within 24 hours.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="border-t mt-16 px-6 py-8"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Yumeo" width={16} height={16} style={{ filter: 'invert(1)' }} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              Yumeo — Research IDE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
            >
              Dashboard
            </Link>
            <Link
              href="/pricing"
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
            >
              Pricing
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
