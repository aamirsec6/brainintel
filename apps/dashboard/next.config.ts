import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
    API_KEY: process.env.API_KEY || 'test_api_key',
  },
};

export default nextConfig;
