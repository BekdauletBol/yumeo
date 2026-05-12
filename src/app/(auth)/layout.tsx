import { ClerkLoaded } from '@clerk/nextjs';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-md flex flex-col items-center space-y-10">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-2xl" style={{ background: 'var(--accent-primary)', fontFamily: 'var(--font-body)' }}>y</div>
          <span className="text-xl font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>yumeo</span>
        </div>

        <ClerkLoaded>
          <div className="w-full">
            {children}
          </div>
        </ClerkLoaded>

        {/* Small text below */}
        <p className="text-text-secondary text-xs font-medium tracking-tight">
          Every answer grounded in your research.
        </p>
      </div>
    </div>
  );
}
