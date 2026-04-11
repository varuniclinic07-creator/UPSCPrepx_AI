/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  transpilePackages: [
    "@tiptap/react",
    "@tiptap/starter-kit",
    "@tiptap/extension-placeholder",
    "@tiptap/extension-highlight",
    "@tiptap/extension-image",
    "@tiptap/extension-link",
    "@tiptap/extension-table",
    "@tiptap/extension-table-cell",
    "@tiptap/extension-table-header",
    "@tiptap/extension-table-row",
    "@tiptap/extension-task-item",
    "@tiptap/extension-task-list",
    "@tiptap/extension-text-align",
    "@tiptap/extension-underline",
    "@tiptap/pm",
    "@tiptap/core",
    "@tiptap/extension-paragraph",
    "@tiptap/extension-text"
  ],

  // Required for Docker standalone deployment
  output: 'standalone',

  // TS checked via `tsc --noEmit` in CI (Supabase generated types cause false positives in Next build)
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint 9 flat config incompatible with Next.js 14 build integration
  // Lint via CI step (npm run lint) instead
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Phase 18: CDN-aware asset delivery
  // MATERIALS_BASE_URL (cdn.aimasteryedu.in) is the CDN origin for study materials.
  // All regions share the same CDN so asset URLs are region-agnostic.
  assetPrefix: process.env.CDN_ASSET_PREFIX || '',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'emotqkukvfwjycvwfvyj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // MinIO on your VPS — primary region
        protocol: 'http',
        hostname: process.env.SERVER_IP || '',
        port: '9000',
      },
      {
        // CDN origin for materials (Cloudflare / BunnyCDN in front of MinIO)
        protocol: 'https',
        hostname: 'cdn.aimasteryedu.in',
      },
      {
        // Allow any aimasteryedu.in subdomain (staging, preview, other regions)
        protocol: 'https',
        hostname: '*.aimasteryedu.in',
      },
    ],
    // Prefer AVIF for modern browsers, fallback to WebP — both CDN-compatible
    formats: ['image/avif', 'image/webp'],
    // Minimize origin hits: aggressive caching
    minimumCacheTTL: 86400, // 24 h
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Treat these CJS packages as external to avoid webpack bundling issues (Next.js 14)
    serverComponentsExternalPackages: ['razorpay', 'pino'],
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
              "connect-src 'self' https://*.supabase.co https://*.9router.com https://api.groq.com https://api.razorpay.com",
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