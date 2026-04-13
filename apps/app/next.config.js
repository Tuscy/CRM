const path = require("path");
const {
  securityHeaderRoutes,
} = require("@stky/security/next-config-headers");

/** Monorepo root (CRM/) — required so Vercel includes pnpm-hoisted Prisma query engines */
const workspaceRoot = path.join(__dirname, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    outputFileTracingRoot: workspaceRoot,
    outputFileTracingIncludes: {
      "/api/**/*": [
        "../../node_modules/.prisma/client/**/*",
        "../../node_modules/@prisma/client/**/*",
        "../../node_modules/.pnpm/**/@prisma+client*/**/*",
      ],
      "/*": [
        "../../node_modules/.prisma/client/**/*",
        "../../node_modules/@prisma/client/**/*",
        "../../node_modules/.pnpm/**/@prisma+client*/**/*",
      ],
    },
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  transpilePackages: [
    "@stky/ui",
    "@stky/builder",
    "@stky/sites",
    "@stky/db",
    "@stky/auth",
    "@stky/security",
  ],
  async headers() {
    return securityHeaderRoutes();
  },
};

module.exports = nextConfig;
