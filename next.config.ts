import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    // pdfjs-dist / react-pdf tries to optionally require 'canvas' for Node.js
    // environments; silence the missing-module warning during the server build.
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
