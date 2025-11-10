/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // THIS IS THE ONLY LINE THAT MATTERS
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@tailwindcss/oxide');
    }
    return config;
  },

  images: {
    domains: ['yffzwfxgwqjlxumxleeb.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;