/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next 14.x option name. (Next 15 renamed this to serverExternalPackages.)
    serverComponentsExternalPackages: ["postgres"],
  },
};

export default nextConfig;
