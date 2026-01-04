import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "xek79n9xg5vqweia.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
