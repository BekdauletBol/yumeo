import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

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

export default clerkMiddleware((auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    auth().protect();
  }
}, {
  // Check if we need to debug
  debug: process.env.NODE_ENV === 'development',
});

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