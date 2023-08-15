const { withElacca } = require('elacca')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: !!process.env.ANAL,
})

/** @type {import('next').NextConfig} */
const nextConfig = withBundleAnalyzer(
    withElacca()({
        reactStrictMode: false,

        experimental: {
            externalDir: true,
            serverMinification: false,
            serverActions: true,
        },
    }),
)

module.exports = nextConfig
