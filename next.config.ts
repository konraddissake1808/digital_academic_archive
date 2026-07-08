import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default is 10MB — too small for academic PDFs/textbooks uploaded via
    // /api/upload, which is matched by src/proxy.ts's matcher and therefore
    // subject to this buffering limit.
    proxyClientMaxBodySize: "50mb",
  },
};

export default nextConfig;
