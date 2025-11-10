/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config) => {
    // Aliases for Three.js and React Three Fiber
    config.resolve.alias['three'] = require.resolve('three');
    config.resolve.alias['@react-three/fiber'] = require.resolve('@react-three/fiber');
    config.resolve.alias['@react-three/drei'] = require.resolve('@react-three/drei');

    // Fallbacks for Node.js modules
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
    };

    // GLSL shader support
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