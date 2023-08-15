const { withElacca } = require('elacca')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: !!process.env.ANAL,
})

/** @type {import('next').NextConfig} */
const config = {
    reactStrictMode: false,

    experimental: {
        externalDir: true,
        serverMinification: false,
        serverActions: true,
    },
}
const nextConfig = withBundleAnalyzer(withElacca()(config))

module.exports = nextConfig
