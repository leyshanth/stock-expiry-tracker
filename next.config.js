/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'], // Add your Appwrite domain here
  },
  // Exclude template directory from build
  webpack: (config, { isServer }) => {
    // Ignore the template directory during build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [...(config.watchOptions?.ignored || []), '**/template/**']
    };
    return config;
  },
};

module.exports = withPWA(nextConfig);
