const {
  securityHeaderRoutes,
} = require("@stky/security/next-config-headers");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
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
