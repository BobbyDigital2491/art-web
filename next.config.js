/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yffzwfxgwqjlxumxleeb.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'peach-informal-llama-875.mypinata.cloud',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },

  webpack: (config) => {
    // Fix A-Frame + WebXR
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; frame-src 'self' https:; worker-src 'self' blob:;",
          },
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
        ],
      },
    ];
  },

  experimental: {
    syncScripts: true,
  },
};

module.exports = nextConfig;