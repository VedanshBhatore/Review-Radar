import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // cacheComponents (experimental "use cache" model) is intentionally left off: this app's
  // pages/routes are inherently request-dynamic (report-by-id, POST orchestration routes),
  // and the explicit force-dynamic model is far more predictable to build against without
  // local framework docs available. See DECISIONS.md.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
