/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['@/components', '@/lib'],
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('socket.io-client');
    }
    return config;
  },
};

module.exports = nextConfig;
