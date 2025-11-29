/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  images: {
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