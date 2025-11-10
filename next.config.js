/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@tailwindcss/oxide');
    }

    // Silence Supabase Realtime warning
    config.ignoreWarnings = [
      { module: /realtime-js/, message: /Critical dependency/ }
    ];

    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yffzwfxgwqjlxumxleeb.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;