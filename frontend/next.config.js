/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    // Suppress the Grammarly extension warnings
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
