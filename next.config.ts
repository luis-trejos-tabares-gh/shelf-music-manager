import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      { source: "/collections", destination: "/shelves", permanent: false },
      { source: "/collections/:id", destination: "/shelves/:id", permanent: false },
    ];
  },
};

export default nextConfig;
