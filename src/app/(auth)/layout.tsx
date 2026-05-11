import { ClerkLoaded } from '@clerk/nextjs';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 selection:bg-[#E8611A]/20">
      <div className="w-full max-w-md flex flex-col items-center space-y-10">
        {/* Y YUMEO Logo in Monospace */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#E8611A] flex items-center justify-center text-white font-mono font-bold text-2xl">Y</div>
          <span className="font-mono text-xl font-bold tracking-[0.3em] text-[#F0F0F0]">YUMEO</span>
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
