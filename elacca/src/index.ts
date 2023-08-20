import * as path from 'path'
import * as fs from 'fs'
import type * as webpack from 'webpack'
import { NextConfig } from 'next'
import { PluginOptions as ElaccaPluginOptions } from './babelTransformPages'

export type PluginOptions = {}

export function plugins(opts) {
    return [
        [require.resolve('../dist/babelTransformPages'), opts],
        // [require.resolve('../dist/babelRemoveUnusedImports'), opts],
        require.resolve('@babel/plugin-syntax-jsx'),
        [require.resolve('@babel/plugin-syntax-typescript'), { isTSX: true }],

        [require.resolve('../dist/babelDebugOutputs'), opts],
    ].filter(Boolean)
}

export function withElacca(config: PluginOptions = {}) {
    return (nextConfig: NextConfig = {}): NextConfig => {
        return {
            ...nextConfig,

            webpack(config: webpack.Configuration, options) {
                const { isServer, dev, dir } = options
                const pagesDir = findPagesDir(dir)
                const apiDir = path.resolve(pagesDir, './api')

                const opts: ElaccaPluginOptions = {
                    isServer,
                    pagesDir,
                    dev,
                    apiDir,
                    basePath: nextConfig.basePath || '/',
                }

                config.module = config.module || {}
                config.module.rules = config.module.rules || []
                config.module.rules.push({
                    test: /\.(tsx|ts|js|mjs|jsx)$/,
                    include: [pagesDir],
                    exclude: [apiDir],
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

// taken from https://github.com/vercel/next.js/blob/v12.1.5/packages/next/lib/find-pages-dir.ts
function findPagesDir(dir: string): string {
    // prioritize ./pages over ./src/pages
    let curDir = path.join(dir, 'pages')
    if (fs.existsSync(curDir)) return curDir

    curDir = path.join(dir, 'src/pages')
    if (fs.existsSync(curDir)) return curDir

    // Check one level up the tree to see if the pages directory might be there
    if (fs.existsSync(path.join(dir, '..', 'pages'))) {
        throw new Error(
            'No `pages` directory found. Did you mean to run `next` in the parent (`../`) directory?',
        )
    }

    throw new Error(
        "Couldn't find a `pages` directory. Please create one under the project root",
    )
}
