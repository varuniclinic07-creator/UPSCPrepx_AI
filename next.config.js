/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Required for Docker standalone deployment
  output: 'standalone',

  // TypeScript checking disabled due to missing Supabase generated types
  // TODO: Run `npx supabase gen types typescript` to regenerate types
  // Then set ignoreBuildErrors: false
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint has Next.js 14 compatibility issues with deprecated options
  // TODO: Update ESLint config when Next.js fixes this
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'emotqkukvfwjycvwfvyj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // MinIO on your VPS - requires SERVER_IP env var
        protocol: 'http',
        hostname: process.env.SERVER_IP || '',
        port: '9000',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Optimize for production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://api.a4f.co https://api.razorpay.com",
              "frame-src 'self' https://api.razorpay.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;