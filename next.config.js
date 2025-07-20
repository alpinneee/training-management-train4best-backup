/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/system', '@mui/icons-material'],
  images: {
    remotePatterns: [
      {
        protocol: 'http', // Tambahkan support untuk HTTP
        hostname: '*',
      },
      {
        protocol: 'https', // Tetap pertahankan HTTPS
        hostname: '*',
      },
    ],
    unoptimized: true, // Untuk static files lokal
  },
  // Memaksa penggunaan SWC
  swcMinify: true,
  experimental: {
    forceSwcTransforms: true,
  }
}

module.exports = nextConfig 