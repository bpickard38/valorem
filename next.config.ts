import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* Product photography is served from Shopify's CDN. Their URLs carry a
     * `?v=<timestamp>` cache-buster that changes every time an image is
     * re-uploaded, so `search` is left open — pinning it would 400 every
     * photo the moment it is replaced in the admin. */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        port: "",
        pathname: "/s/files/**",
      },
    ],
  },
};

export default nextConfig;
