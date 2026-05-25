/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      '/api/data/**': ['./data/**'],
      '/api/sheets': ['./data/**'],
    },
  },
};

module.exports = nextConfig;
