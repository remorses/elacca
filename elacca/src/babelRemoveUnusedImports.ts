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

export default function deadCodeTerminator(
    { types: t }: Babel,
    { apiDir, pagesDir, isServer, testing, basePath }: any,
): babel.PluginObj {
    let shouldSkip = false
    return {
        visitor: {
            Program(program, state) {
                console.log('refs', state.refs)
                const filePath =
                    getFileName(state) ?? nodePath.join('pages', 'Default.js')

                if (shouldBeSkipped(filePath, program)) {
                    shouldSkip = true

                    return
                }
            },
            // <FunctionDeclaration(path) {
            //     if (shouldSkip) {
            //         return
            //     }
            //     const { node } = path
            //     logger.log('FunctionDeclaration', node.id?.name)
            //     logger.log('FunctionDeclaration', node.body)
            // },

            // ImportDeclaration(path /* :any */) {
            //     if (shouldSkip) {
            //         logger.log('skipping import removing')
            //         return
            //     }
            //     // if (path.removed) {
            //     //     return
            //     // }
            //     const specifiers = path.get('specifiers')

            //     // Imports with no specifiers is probably specifically for side effects
            //     let shakeDeclaration = specifiers.length > 0

            //     for (const specifier of specifiers) {
            //         let shakeSpecifier = true

            //         const localPath = specifier.get('local')
            //         const localName = localPath.node.name
            //         // This should not be hardcoded to React and/or improve compat with JSX transform
            //         if (localName === 'React') {
            //             shakeSpecifier = false
            //             shakeDeclaration = false
            //             break
            //         }
            //         const binding = localPath.scope.bindings[localName]
            //         // console.log('binding', binding)
            //         if (binding) {
            //             logger.log(`removing binding ${localName}`)
            //             shakeSpecifier = false
            //             shakeDeclaration = false
            //             const refPaths = binding.referencePaths

            //             for (const path of refPaths) {
            //                 logger.log(`${localName}`, path)
            //                 // const unreachable = isPathCertainlyUnreachable(path)
            //                 // if (!unreachable) {
            //                 //     shakeSpecifier = false
            //                 //     shakeDeclaration = false
            //                 // }
            //             }
            //         } else {
            //             // If binding doesn't exist, then this is an indication the import was
            //             // added by a plugin (rather existing than the original source code)
            //             // To be conservative, don't shake in this case.
            //             shakeSpecifier = false
            //             shakeDeclaration = false
            //         }
            //         if (shakeSpecifier) {
            //             specifier.remove()
            //         }
            //     }

            //     if (shakeDeclaration) {
            //         path.remove()
            //     }
            // },>
        },
    }
}
