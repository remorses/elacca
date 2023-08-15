const { withElacca } = require('elacca')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: !!process.env.ANAL,
})

/** @type {import('next').NextConfig} */
const config = {
    reactStrictMode: false,

    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Disable externalizing dependencies
        config.externals = (context, request, callback) => {
            // Exclude specific dependencies from externalization
            if (/\b(your-dependency-1|your-dependency-2)\b/.test(request)) {
                return callback()
            }

            // Bundle all other dependencies
            callback()
        }

        return config
    },
    experimental: {
        externalDir: true,
        serverMinification: false,
        serverActions: true,
    },
}
const nextConfig = withBundleAnalyzer(withElacca()(config))

module.exports = nextConfig
