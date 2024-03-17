import * as path from 'path'
import * as fs from 'fs'
import type * as webpack from 'webpack'
import { NextConfig } from 'next'
import {
    PluginOptions as ElaccaPluginOptions,
    findPagesDir,
} from './babelTransformPages'

export type PluginOptions = {}

export function plugins(opts: { isServer?: boolean; pagesDir?: string }) {
    return [
        [require.resolve('../dist/babelTransformPages'), opts],
        // [require.resolve('../dist/babelRemoveUnusedImports'), opts],
        require.resolve('@babel/plugin-syntax-jsx'),
        // [require.resolve('@babel/plugin-syntax-typescript'), { isTSX: true }],
        [
            require.resolve('@babel/plugin-transform-typescript'),
            { isTSX: true },
        ],

        process.env.DEBUG_ELACCA && [
            require.resolve('../dist/babelDebugOutputs'),
            opts,
        ],

        // require.resolve('@babel/plugin-transform-react-jsx'),
    ].filter(Boolean)
}

export function withElacca(config: PluginOptions = {}) {
    return (nextConfig: NextConfig = {}): NextConfig => {
        applyTurbopackOptions(nextConfig)
        // return nextConfig

        if (process.env.DEBUG_ELACCA) {
            try {
                fs.rmdirSync('./elacca-outputs', { recursive: true })
            } catch {}
        }
        return {
            ...nextConfig,

            webpack(config: webpack.Configuration, options) {
                const { isServer, dev, dir } = options
                const pagesDir = findPagesDir(dir)
                const apiDir = path.resolve(pagesDir, './api')

                const opts: ElaccaPluginOptions = {
                    isServer,
                    pagesDir,

                    // apiDir,
                    // basePath: nextConfig.basePath || '/',
                }

                config.module = config.module || {}
                config.module.rules = config.module.rules || []
                config.module.rules.push({
                    test: /\.(tsx|ts|js|mjs|jsx)$/,
                    resource: {
                        and: [pagesDir],
                        not: [apiDir],
                    },
                    use: [
                        options.defaultLoaders.babel,
                        {
                            loader: require.resolve('babel-loader'),
                            options: {
                                sourceMaps: dev,
                                plugins: plugins(opts),
                            },
                        },
                    ],
                })

                if (typeof nextConfig.webpack === 'function') {
                    return nextConfig.webpack(config, options)
                } else {
                    return config
                }
            },
        }
    }
}

function applyTurbopackOptions(nextConfig: NextConfig): void {
    nextConfig.experimental ??= {}
    nextConfig.experimental.turbo ??= {}
    nextConfig.experimental.turbo.rules ??= {}

    const rules = nextConfig.experimental.turbo.rules

    const pagesDir = findPagesDir(process.cwd())
    const globs = [ '{./src/pages,./pages/}/**/*.{ts,tsx,js,jsx}']
    for (const glob of globs) {
        // @ts-expect-error
        rules[glob] = {
            browser: {
                // as: 'browser',
                loaders: [
                    {
                        loader: require.resolve('../dist/turbopackLoader'),
                        options: {
                            isServer: false,
                            pagesDir,
                        },
                    },
                ],
            },
            default: {
                // as: 'default',
                loaders: [
                    {
                        loader: require.resolve('../dist/turbopackLoader'),
                        options: {
                            isServer: true,
                            pagesDir,
                        },
                    },
                ],
            },
        }
    }
}
