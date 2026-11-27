import type { NextConfig } from 'next'

const path = require('path')

/** @type {import('next').NextConfig} */
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: true,
// })

const nextConfig: NextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },

  compiler: {
    styledComponents: {
      displayName: true,
      ssr: true,
    },
  },
}

if (process.env.NEXT_PUBLIC_BUILD) {
  nextConfig.productionBrowserSourceMaps = false
  nextConfig.reactStrictMode = true
  nextConfig.cleanDistDir = true
  nextConfig.compress = true

  nextConfig.experimental = {
    gzipSize: true,
    optimizeCss: true,
    turbopackMinify: true,
    optimizePackageImports: ['react-device-detect', 'zustand', '@tanstack/react-query'],
  }

  nextConfig.compiler = {
    styledComponents: {
      displayName: true,
      ssr: true,
      minify: true,
    },
    reactRemoveProperties: true,
  }
}

module.exports = nextConfig
