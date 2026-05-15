import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

import { ThemeProvider } from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'Yumeo — Research IDE',
  description: 'A structured workspace where every AI response is grounded in your own materials.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <html lang="en">
        <body className="flex items-center justify-center min-h-screen bg-black text-white p-8">
          <div className="max-w-md w-full p-6 rounded-xl border border-red-500/30 bg-red-500/10 text-center">
            <h1 className="text-xl font-bold mb-4 text-red-500">Clerk Configuration Missing</h1>
            <p className="text-sm text-gray-400 mb-6">
              The Clerk Publishable Key is missing. Please add 
              <code className="mx-1 px-1 bg-white/10 rounded">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> 
              to your environment variables.
            </p>
            <a 
              href="https://dashboard.clerk.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Get your keys from Clerk Dashboard
            </a>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            storageKey="yumeo-theme"
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}