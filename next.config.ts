import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: rootDir,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.localfalcon.com",
      },
      {
        protocol: "https",
        hostname: "**.localrankingtracker.com",
      },
    ],
  },
};

export default nextConfig;
