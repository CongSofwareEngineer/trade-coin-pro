import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Only apply browser fallbacks on the client build
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false, // Prevent bundling 'fs' in client
      path: false,
      os: false,
    }

    // Some transitive deps (e.g. a library pulling in 'brotli') may reference
    // Node internals. If you don't actually need the brotli *encoding* logic
    // at runtime in the browser, you can safely alias it to a stub. This
    // avoids Turbopack/webpack trying to follow 'fs' inside that package.
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      brotli: require.resolve('./stubs/empty.js'),
    }

    return config
  },
}

export default nextConfig
