import type webpack from 'webpack'
import { transform } from '@babel/core'
import { plugins } from '.'
import { logger } from './utils'
import { transform as esbuildTransform } from 'esbuild'
import { shouldBeSkipped } from './babelTransformPages'

export default async function (
    this: LoaderThis<any>,
    source: string,
    map: any,
) {
    if (typeof map === 'string') {
        map = JSON.parse(map)
    }
    // eslint-disable-next-line no-console
    // console.log(JSON.stringify(this, null, 2))
    const callback = this.async()

    try {
        const skip = async () => {
            const res = await esbuildTransform(source, {
                loader: 'tsx',
                sourcefile: this.resourcePath,
                jsx: 'preserve',
                // jsx: 'transform',
                // jsxDev: true,

                sourcemap: true,
            })
            callback(null, res.code, res.map)
        }

        const options = this.getOptions()
        const { isServer, pagesDir } = options

        // console.log('isServer', isServer)
        if (shouldBeSkipped({ filePath: this.resourcePath || '', pagesDir })) {
            await skip()
            return
        }

        const res = transform(source || '', {
            babelrc: false,
            sourceType: 'module',
            plugins: plugins({ isServer, pagesDir }) as any,
            filename: this.resourcePath,

            // cwd: process.cwd(),
            inputSourceMap: map,
            sourceMaps: true,

            // cwd: this.context,
        })

        if (res) {
            callback(
                null,
                res?.code || '',
                JSON.stringify(res.map) || undefined,
            )
        } else {
            logger.error('no result')
            await skip()
        }
    } catch (e: any) {
        logger.error(e)
        callback(e)
    }
}

export type LoaderThis<Options> = {
    /**
     * Path to the file being loaded
     *
     * https://webpack.js.org/api/loaders/#thisresourcepath
     */
    resourcePath: string

    /**
     * Function to add outside file used by loader to `watch` process
     *
     * https://webpack.js.org/api/loaders/#thisadddependency
     */
    addDependency: (filepath: string) => void

    /**
     * Marks a loader result as cacheable.
     *
     * https://webpack.js.org/api/loaders/#thiscacheable
     */
    cacheable: (flag: boolean) => void

    /**
     * Marks a loader as asynchronous
     *
     * https://webpack.js.org/api/loaders/#thisasync
     */
    async: webpack.LoaderContext<any>['async']

    /**
     * Return errors, code, and sourcemaps from an asynchronous loader
     *
     * https://webpack.js.org/api/loaders/#thiscallback
     */
    callback: webpack.LoaderContext<any>['callback']
    /**
     * Loader options in Webpack 5
     *
     * https://webpack.js.org/api/loaders/#thisgetoptionsschema
     */
    getOptions: () => Options
}
