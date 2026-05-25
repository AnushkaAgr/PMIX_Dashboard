/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/api/data/**': ['./data/**'],
    '/api/sheets': ['./data/**'],
  },
};

module.exports = nextConfig;
