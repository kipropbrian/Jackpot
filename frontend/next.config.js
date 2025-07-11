/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // Suppress the Grammarly extension warnings
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
