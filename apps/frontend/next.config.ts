import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Next.js 15: Externe Pakete für Server Components (aus experimental herausgezogen)
  serverExternalPackages: ["@prisma/client"],
  images: {
    // SVG-Logos erlauben
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
