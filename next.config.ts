import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint saat build
  },
  // Konfigurasi rewrites untuk mengarahkan permintaan API ke backend Laravel
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*', // Arahkan ke backend Laravel
      },
    ];
  },
};

export default nextConfig;
