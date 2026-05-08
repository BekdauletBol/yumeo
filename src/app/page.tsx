'use client';

import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const SPLIT_FADE_DELAY_MS = 800;
const SPLIT_FADE_DURATION_MS = 600;
const TEXT_START_DELAY_MS = SPLIT_FADE_DELAY_MS + SPLIT_FADE_DURATION_MS;
const TEXT_LINE_DELAY_MS = 100;
const EXIT_FADE_DURATION_MS = 600;
const CURSOR_BLINK_DURATION_MS = 1000;

const textLines = [
  {
    id: 'title',
    content: 'YUMEO',
    className:
      'text-[1.25rem] md:text-[1.5rem] tracking-[0.3em] text-[#F0F0F0] font-normal',
  },
  {
    id: 'tagline',
    content: '/ research IDE /',
    className: 'text-[0.65rem] md:text-[0.7rem] text-[#E8611A] mt-1 mb-4',
  },
  {
    id: 'desc-1',
    content: 'AI workspace for writing academic papers',
    className: 'text-[0.75rem] md:text-[0.8rem] text-[#777777] leading-[1.9]',
  },
  {
    id: 'desc-2',
    content: 'without hallucinating sources.',
    className:
      'text-[0.75rem] md:text-[0.8rem] text-[#777777] leading-[1.9] mb-4',
  },
  {
    id: 'flow-1',
    content: 'Upload references →',
    className: 'text-[0.75rem] md:text-[0.8rem] text-[#777777] leading-[1.9]',
  },
  {
    id: 'flow-2',
    content: 'AI writes strictly from them →',
    className: 'text-[0.75rem] md:text-[0.8rem] text-[#777777] leading-[1.9]',
  },
  {
    id: 'flow-3',
    content: 'Export verified report.',
    className:
      'text-[0.75rem] md:text-[0.8rem] text-[#777777] leading-[1.9] mb-4',
  },
  {
    id: 'cta',
    content: 'Press Enter to continue',
    className: 'text-[0.75rem] md:text-[0.8rem] text-[#E8611A]',
    withCursor: true,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [splitVisible, setSplitVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const rootStyle = {
    '--cursor-blink-duration': `${CURSOR_BLINK_DURATION_MS}ms`,
  } as CSSProperties;
  const handleEnter = () => {
    if (!isExiting) {
      setIsExiting(true);
    }
  };

  useEffect(() => {
    const splitTimer = setTimeout(() => setSplitVisible(true), SPLIT_FADE_DELAY_MS);
    const textTimer = setTimeout(() => setTextVisible(true), TEXT_START_DELAY_MS);
    return () => {
      clearTimeout(splitTimer);
      clearTimeout(textTimer);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleEnter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExiting]);

  useEffect(() => {
    if (!isExiting) return;
    const exitTimer = setTimeout(
      () => router.push('/sign-in'),
      EXIT_FADE_DURATION_MS,
    );
    return () => clearTimeout(exitTimer);
  }, [isExiting, router]);

  const splitOpacityClass =
    splitVisible && !isExiting ? 'opacity-100' : 'opacity-0';

  return (
    <div className="min-h-screen w-full bg-[#000000]" style={rootStyle}>
      <div
        className={`flex h-screen w-full flex-col md:flex-row transition-opacity ${splitOpacityClass}`}
        style={{
          transitionTimingFunction: 'ease',
          transitionDuration: `${SPLIT_FADE_DURATION_MS}ms`,
        }}
      >
        <div className="relative h-[45vh] w-full bg-[#000000] md:h-full md:w-1/2">
          <Image
            src="/landing-art.jpg"
            alt="Abstract research workspace illustration"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(0,0,0,0.3))',
            }}
          />
        </div>

        <div
          className="flex h-[55vh] w-full flex-col items-start justify-center bg-[#1a1a1a] p-12 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E8611A] focus-visible:outline-offset-2 md:h-full md:w-1/2"
          style={{ fontFamily: 'var(--font-mono)' }}
          aria-label="Press Enter to continue"
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleEnter();
            }
          }}
        >
          <div className="w-full">
            {textLines.map((line, index) => (
              <div
                key={line.id}
                className={`${line.className} transition-opacity duration-300 ${
                  textVisible ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ transitionDelay: `${index * TEXT_LINE_DELAY_MS}ms` }}
              >
                {line.content}
                {line.withCursor ? (
                  <span className="landing-cursor">▊</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
