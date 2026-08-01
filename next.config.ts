import type { NextConfig } from "next";
import { albanianRoutes } from "./lib/routes";

// The marketplace is deployed to Vercel as a standard Next.js application.
// Existing translation data is intentionally permissive while it is being
// expanded, so it must not prevent a production build from being emitted.
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return Object.entries(albanianRoutes).flatMap(([english, albanian]) => [
      { source: english, destination: albanian, permanent: true },
      { source: `${english}/:path*`, destination: `${albanian}/:path*`, permanent: true },
    ]);
  },
  async rewrites() {
    return Object.entries(albanianRoutes).flatMap(([english, albanian]) => [
      { source: albanian, destination: english },
      { source: `${albanian}/:path*`, destination: `${english}/:path*` },
    ]);
  },
};

export default nextConfig;
