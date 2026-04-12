import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3001',
        '138.68.74.105',
        'highandseek.com',
        'highandseek.cz',
        'www.highandseek.com',
        'www.highandseek.cz',
      ],
    },
  },
};

export default nextConfig;
