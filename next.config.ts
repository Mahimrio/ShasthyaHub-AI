import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// NOTE: @serwist/next requires webpack, but Next.js 16 defaults to Turbopack.
// Until Serwist adds Turbopack support, the Serwist-compiled SW (via swSrc/swDest)
// would fail to compile. The hand-written public/sw.js IS the production SW.
// Keep the withSerwist wrapper for future compatibility (it's a no-op under
// Turbopack thanks to the catch in @serwist/next's own code), but don't rely on it.
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts.future",
  swDest: "public/sw.js",
  reloadOnOnline: true,
  disable: true, // always disabled — public/sw.js is the single source of truth
});

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  turbopack: {},
};

export default withSerwist(nextConfig);
