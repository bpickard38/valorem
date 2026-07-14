import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Frame sequences and FX clips are content-addressed by folder name;
        // regenerating a segment gets a new folder, so cache forever.
        source: "/:dir(sequences|fx|plates)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
