import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing',
  '/docs',
  '/api/health(.*)',
  '/api/stripe/webhook(.*)',
  '/api/v1/(.*)',
  '/favicon.ico',
  '/pdf.worker.min.mjs', // PDF.js worker must be publicly accessible
]);

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  // If the publishable key is missing, skip Clerk entirely to prevent crashing.
  // The RootLayout safety check will display the appropriate configuration error UI.
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }

  return clerkMiddleware((auth, req) => {
    // Protect all routes except public ones
    if (!isPublicRoute(req)) {
      auth().protect();
    }
  }, {
    debug: process.env.NODE_ENV === 'development',
  })(request, event);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Static file extensions
     */
    '/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|css|js|mjs|woff|woff2|ttf|otf|csv|zip|webmanifest)).*)',
  ],
};