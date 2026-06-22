import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/user",
        destination: "/account",
        permanent: false
      },
      {
        source: "/user/:path*",
        destination: "/account/:path*",
        permanent: false
      },
      {
        source: "/account/messages",
        destination: "/account/tickets",
        permanent: false
      },
    ];
  },
  allowedDevOrigins: [
    "192.168.1.23",
    "192.168.1.23:3000",
    "localhost",
    "localhost:3000"
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.alicdn.com" },
      { protocol: "https", hostname: "*.alicdn.com.cn" },
      { protocol: "https", hostname: "*.taobaocdn.com" },
      { protocol: "https", hostname: "*.geilicdn.com" },
      { protocol: "https", hostname: "cdn.superbuy.com" }
    ]
  }
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
