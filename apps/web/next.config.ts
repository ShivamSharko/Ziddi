import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ziddi/agent", "@ziddi/domain", "@ziddi/ui"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

