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

  async redirects() {
    return [
      /* The Discovery Set was retired on 2026-07-25 and its route deleted.
       * The page was indexed and linked from ads, so it must not 404 —
       * anyone arriving on it lands on the collection grid, where the 5 ml
       * sample that replaced the set is one tap away. Permanent (301) so the
       * ranking signal transfers rather than being held open. */
      {
        source: "/discovery",
        destination: "/collections",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
