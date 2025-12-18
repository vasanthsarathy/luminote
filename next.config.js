/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export to support API routes
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
