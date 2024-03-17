import * as babel from '@babel/core'
import generate from '@babel/generator'
import * as types from '@babel/types'
import fs from 'fs'
import { default as nodePath, default as path } from 'path'
import { shouldBeSkipped } from './babelTransformPages'
import { getFileName, logger } from './utils'

type Babel = { types: typeof types }

let deletedDir = false

export default function debugOutputsPlugin(
    { types: t }: Babel,
    { apiDir, pagesDir, isServer, basePath }: any,
): babel.PluginObj | undefined {
    const cwd = process.cwd()
    
    if (!deletedDir) {
        deletedDir = true
        
        fs.mkdirSync('./elacca-outputs', { recursive: true })
    }
    return {
        visitor: {
            Program: {
                exit(program, state) {
                    const filePath =
                        getFileName(state) ??
                        nodePath.join('pages', 'Default.js')

                    if (!process.env.DEBUG_ELACCA) {
                        return
                    }
                    if (shouldBeSkipped({filePath, program, pagesDir})) {
                        logger.log('skipping because not a page', filePath)
                        return
                    }

                    // stringify the AST and print it
                    const output = generate(
                        program.node,
                        {
                            /* options */
                        },
                        this.file.code,
                    )
                    let p = path.resolve(
                        './elacca-outputs',
                        isServer ? 'server/' : 'client/',
                        path.relative(cwd, path.resolve(filePath)),
                    )
                    logger.log(`plugin output:`, p)
                    fs.mkdirSync(path.dirname(p), { recursive: true })
                    fs.writeFileSync(p, output.code)
                },
            },
        },
    }
}
