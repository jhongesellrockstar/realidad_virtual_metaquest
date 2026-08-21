import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.RENDER_STATIC_EXPORT === "true" ? "export" : "standalone",
};

export default nextConfig;
