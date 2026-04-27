/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
      serverComponentsExternalPackages: ['pdfjs-dist'],
    },
    images: {
      remotePatterns: [
        { protocol: 'https', hostname: '*.supabase.co' },
      ],
    },
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' blob: data: https://*.supabase.co",
                "font-src 'self' data:",
                "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://clerk.com https://*.clerk.accounts.dev",
                "worker-src 'self' blob:",
              ].join('; '),
            },
          ],
        },
      ];
    },
  };
  
  export default nextConfig;