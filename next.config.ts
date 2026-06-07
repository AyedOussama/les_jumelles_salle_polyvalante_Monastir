import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const vercelDeploymentId = process.env.VERCEL_DEPLOYMENT_ID
  ? process.env.VERCEL_DEPLOYMENT_ID.replace(/^dpl_/, "dpl-").slice(0, 32)
  : undefined;

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com",
  "media-src 'self' blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src https://www.google.com https://maps.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  isDev ? "" : "upgrade-insecure-requests",
].filter(Boolean).join("; ");

const nextConfig: NextConfig = {
  deploymentId: process.env.NEXT_DEPLOYMENT_ID || vercelDeploymentId,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Keep room for the multipart envelope around a validated 4 MiB image.
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
