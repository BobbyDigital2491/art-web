/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // THIS LINE FIXES THE VERCEL BUILD ERROR
  webpack: (config) => {
    config.externals.push('@tailwindcss/oxide');
    return config;
  },

  // Your existing config (keep all of this)
  images: {
    domains: ['yffzwfxgwqjlxumxleeb.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },

  // Optional: Three.js optimizations
  webpack: (config) => {
    config.externals.push('@tailwindcss/oxide');

    config.resolve.alias = {
      ...config.resolve.alias,
      three: require.resolve('three'),
    };

    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader', 'glslify-loader'],
    });

    return config;
  },
};

module.exports = nextConfig;