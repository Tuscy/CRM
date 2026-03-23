/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@stky/ui", "@stky/builder", "@stky/sites", "@stky/db", "@stky/auth"],
};

module.exports = nextConfig;
