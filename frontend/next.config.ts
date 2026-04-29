import type { NextConfig } from "next";

// Baked into the rewrite destination by `next build`. A missing value here
// produces an image that proxies /api/* to itself in production — fail loud.
const BACKEND_URL = process.env.BACKEND_URL;
if (!BACKEND_URL) {
  throw new Error(
    "BACKEND_URL must be set at build time (pass via --build-arg in Docker, " +
      "or export it before `next build`/`next dev`).",
  );
}

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
