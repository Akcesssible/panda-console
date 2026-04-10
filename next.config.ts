import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Force Turbopack to transpile recharts + its vendored d3 deps through
  // Next.js's own CJS pipeline, avoiding the ESM "adapterFn is not a function"
  // error caused by Turbopack picking up victory-vendor's ES module build.
  transpilePackages: ["recharts", "victory-vendor"],

  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
