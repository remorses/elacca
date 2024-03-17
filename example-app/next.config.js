const { withElacca } = require('elacca')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: !!process.env.ANAL,
})

/** @type {import('next').NextConfig} */
const config = {
    reactStrictMode: false,
    typescript: {
        ignoreBuildErrors: true,
    },
    output: 'standalone',
    outputFileTracing: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    cleanDistDir: true,
    experimental: {
        externalDir: true,
        // serverMinification: false,
        outputFileTracingExcludes: {
            '*': [
                '@vercel', //
                'react-dom-experimental',
                'babel-packages',
                'babel',
                'node-fetch',
            ].map((x) => './**/next/compiled/' + x),
        },
    },
}
const nextConfig = withBundleAnalyzer(withElacca()(config))

module.exports = nextConfig
