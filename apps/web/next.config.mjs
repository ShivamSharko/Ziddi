/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ziddi/agent", "@ziddi/domain", "@ziddi/ui"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

