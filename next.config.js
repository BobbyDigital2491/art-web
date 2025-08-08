/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    // Aliases for Three.js and React Three Fiber to prevent module resolution issues
    config.resolve.alias['three'] = require.resolve('three');
    config.resolve.alias['@react-three/fiber'] = require.resolve('@react-three/fiber');
    config.resolve.alias['@react-three/drei'] = require.resolve('@react-three/drei');

    // Fallbacks for Node.js modules not needed in browser
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
    };

    // Ensure WebGL-related modules are bundled correctly
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader', 'glslify-loader'],
      exclude: /node_modules/,
    });

    return config;
  },
  // Enable image optimization for Supabase-hosted assets and placeholder
  images: {
    domains: ['yffzwfxgwqjlxumxleeb.supabase.co', 'via.placeholder.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Ensure ES modules are handled correctly
  experimental: {
    esmExternals: 'loose',
  },
};

module.exports = nextConfig;