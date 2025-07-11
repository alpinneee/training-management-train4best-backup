/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/system', '@mui/icons-material'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      },
    ],
  },
  // Memaksa penggunaan SWC
  swcMinify: true,
  experimental: {
    forceSwcTransforms: true,
  }
}

module.exports = nextConfig 