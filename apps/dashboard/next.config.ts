import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignore ESLint during builds to avoid module resolution issues
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't ignore TypeScript errors - we want to catch real issues
    ignoreBuildErrors: false,
  },
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
    API_KEY: process.env.API_KEY || 'test_api_key',
  },
};

export default nextConfig;
