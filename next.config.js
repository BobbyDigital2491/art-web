/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config) => {
    // Fix Tailwind v4 oxide native binary error on Vercel
    config.externals.push({
      '@tailwindcss/oxide': 'commonjs @tailwindcss/oxide',
    });

    // Your existing aliases
    config.resolve.alias['three'] = require.resolve('three');
    config.resolve.alias['@react-three/fiber'] = require.resolve('@react-three/fiber');
    config.resolve.alias['@react-three/drei'] = require.resolve('@react-three/drei');

    // Fallbacks
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
    };

    // GLSL
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader', 'glslify-loader'],
      exclude: /node_modules/,
    });

    return config;
  },

  images: {
    domains: ['yffzwfxgwqjlxumxleeb.supabase.co', 'via.placeholder.com'],
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;