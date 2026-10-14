import type { NextConfig } from "next";

/* One page, rendered to static HTML at build time. Vercel serves it from its
   edge; nothing runs on a server per visit. */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The tests build the page twice side by side (with and without tags); a normal build is .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
