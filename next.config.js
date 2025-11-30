/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600, // Cache optimized images for 1 hour
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
    return config;
  },
}; 