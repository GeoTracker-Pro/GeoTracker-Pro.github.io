/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes for MongoDB integration
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // For deployment, set this to your base path if needed
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
};

module.exports = nextConfig;
