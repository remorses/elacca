import { addNamed as addNamedImport } from '@babel/helper-module-imports'
import annotateAsPure from '@babel/helper-annotate-as-pure'

import type { NodePath, PluginPass } from '@babel/core'

import * as babel from '@babel/core'
import generate from '@babel/generator'
import { parse } from '@babel/parser'
import * as types from '@babel/types'
import { isExportDefaultDeclaration } from '@babel/types'
import dedent from 'dedent'
import fs from 'fs'
import { default as nodePath, default as path } from 'path'
import {
    defaultExportName,
    elaccaDirective,
    isReactCall,
    logger,
} from './utils'
import { PluginOptions } from '.'
import { getFileName, shouldBeSkipped } from './babelTransformPages'

type Babel = { types: typeof types }

let deletedDir = false

export default function debugOutputsPlugin(
    { types: t }: Babel,
    { apiDir, pagesDir, isServer, basePath }: any,
): babel.PluginObj {
    const cwd = process.cwd()
    if (!process.env.DEBUG_ELACCA) {
        return
    }
    if (!deletedDir) {
        deletedDir = true
        try {
            fs.rmdirSync('./elacca-outputs', { recursive: true })
        } catch {}
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
                    if (shouldBeSkipped(filePath, program)) {
                        logger.log('skipping because not a page', filePath)
                        return
                    }

                    // stringify the AST and print it
                    const output = generate(
                        program.node,
                        {
                            /* options */
                        },
                        // @ts-expect-error
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
