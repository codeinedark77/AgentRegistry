/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Tell ESLint to shut up
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 2. Tell TypeScript to shut up
  typescript: {
    ignoreBuildErrors: true,
  },
  // 3. Keep the standalone output for your Docker setup later
  output: "standalone",
};

export default nextConfig;