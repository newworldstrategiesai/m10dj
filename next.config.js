/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  // Performance optimizations
  swcMinify: true, // Use SWC for minification (faster than Terser)
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Optimize compilation
  typescript: {
    // Skip type checking during build (faster, but less safe)
    // You can run `tsc --noEmit` separately for type checking
    ignoreBuildErrors: false,
    // Exclude Supabase Edge Functions from type checking
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    // Only run ESLint on changed files during dev (faster)
    ignoreDuringBuilds: false,
  },
  // Reduce compilation time
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  images: {
    formats: ['image/avif', 'image/webp'], // AVIF first for better compression
    minimumCacheTTL: 31536000, // Cache for 1 year (images are immutable)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable image optimization
    dangerouslyAllowSVG: false, // Security: disable SVG optimization
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm10djcompany.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.m10djcompany.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tipjar.live',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.tipjar.live',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'djdash.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.djdash.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Exclude backup and copy files from build
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  webpack: (config, { isServer }) => {
    // Exclude backup files and markdown files from build
    config.module.rules.push({
      test: /\.(bak|copy|md)$/,
      use: 'ignore-loader',
    });
    
    // Exclude Supabase Edge Functions (Deno code) from Next.js build
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    config.module.rules.push({
      test: /supabase\/functions\/.*\.ts$/,
      use: 'ignore-loader',
    });
    // Exclude agents directory (separate server process)
    config.module.rules.push({
      test: /agents\/.*\.ts$/,
      use: 'ignore-loader',
    });
    
    // Exclude Puppeteer from client-side bundle (server-only)
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'puppeteer': 'commonjs puppeteer',
      });
    }
    
    return config;
  },
}; 