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
       * ranking signal transfers rather than being held open.
       *
       * statusCode: 301 rather than `permanent: true`, which emits a 308.
       * Both are permanent and Google treats them alike, but 308 preserves
       * the request method and is understood by less of the older tooling
       * that will crawl these ad links. `permanent` and `statusCode` are
       * mutually exclusive — setting both is a config error. */
      {
        source: "/discovery",
        destination: "/collections",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
