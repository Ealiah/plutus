import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin the trace root to this project. Without it Next walks up to the nearest
  // parent lockfile and nests the standalone bundle under the full path.
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,
  // better-sqlite3 is a native module — Next must NOT bundle it
  serverExternalPackages: ["better-sqlite3"],
  // Make sure landing.html ships in the standalone build
  outputFileTracingIncludes: {
    "/": ["./landing.html"],
  },
};

export default nextConfig;
