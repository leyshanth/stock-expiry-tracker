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
    // Ensure watchOptions exists
    config.watchOptions = config.watchOptions || {};
    
    // Ensure ignored is an array
    if (!config.watchOptions.ignored) {
      config.watchOptions.ignored = [];
    } else if (!Array.isArray(config.watchOptions.ignored)) {
      // If it's not an array, convert it to one
      config.watchOptions.ignored = [config.watchOptions.ignored];
    }
    
    // Add template directory to ignored
    config.watchOptions.ignored.push('**/template/**');
    
    return config;
  },
};

module.exports = withPWA(nextConfig);
