import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: '#0e0e0e' }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12 relative overflow-hidden"
        style={{
          background: '#111111',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Subtle grid pattern */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />

        {/* Glow accent */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-120px',
            left: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,200,200,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" fill="rgba(255,255,255,0.7)" />
                <rect x="8" y="1" width="5" height="5" fill="rgba(255,255,255,0.4)" />
                <rect x="1" y="8" width="5" height="5" fill="rgba(255,255,255,0.4)" />
                <rect x="8" y="8" width="5" height="5" fill="rgba(255,255,255,0.2)" />
              </svg>
            </div>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '16px',
              fontWeight: '500',
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '-0.01em',
            }}>
              Yumeo
            </span>
          </div>
          <p style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.04em',
            marginLeft: '38px',
          }}>
            Research IDE
          </p>
        </div>

        {/* Feature list */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {[
            { label: 'Grounded AI', desc: 'Every response backed by your uploaded sources' },
            { label: 'Citation tracking', desc: 'Inline references tied to exact document passages' },
            { label: 'Multi-format export', desc: 'Markdown, PDF, and structured reports' },
          ].map((item) => (
            <div key={item.label} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{
                  width: '4px',
                  height: '4px',
                  background: 'rgba(255,255,255,0.5)',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.75)',
                  fontWeight: '500',
                }}>
                  {item.label}
                </span>
              </div>
              <p style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.35)',
                lineHeight: '1.6',
                paddingLeft: '12px',
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={{
          position: 'relative',
          zIndex: 1,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.2)',
        }}>
          © 2026 Yumeo. All rights reserved.
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 text-center">
          <h1 style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '20px',
            fontWeight: '500',
            color: 'rgba(255,255,255,0.9)',
          }}>
            Yumeo
          </h1>
          <p style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.35)',
            marginTop: '4px',
          }}>
            Research IDE — grounded in your materials
          </p>
        </div>

        {/* Clerk form */}
        <div>{children}</div>

        {/* Bottom tagline */}
        <p style={{
          marginTop: '32px',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.2)',
          textAlign: 'center',
          maxWidth: '320px',
        }}>
          Every AI response grounded exclusively in your uploaded research.
        </p>
      </div>
    </div>
  );
}