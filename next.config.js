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
      {
        protocol: 'https',
        hostname: 'peach-informal-llama-875.mypinata.cloud',
        pathname: '/ipfs/bafybeigzf6vg6cjkv4e52czwgacp26ntvhm2qb7u7r3xbrhinxavgd3qou',
      },
    ],
  },
};

module.exports = nextConfig;