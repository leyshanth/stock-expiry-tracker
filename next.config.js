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
  webpack: (config) => {
    // Simply set watchOptions with our pattern
    config.watchOptions = {
      ...config.watchOptions,
      ignored: /node_modules|.git|template/
    };
    
    return config;
  },
};

module.exports = withPWA(nextConfig);
