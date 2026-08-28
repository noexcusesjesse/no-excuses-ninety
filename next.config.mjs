/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next 14.x option name. (Next 15 renamed this to serverExternalPackages.)
    serverComponentsExternalPackages: ["postgres"],
  },
  async redirects() {
    return [
      // Legacy nested /app client house → /client
      { source: "/app", destination: "/client", permanent: false },
      { source: "/app/dashboard", destination: "/client", permanent: false },
      { source: "/app/cycle", destination: "/client/month", permanent: false },
      { source: "/app/:path*", destination: "/client/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
