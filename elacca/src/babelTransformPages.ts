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
import { removeFunctionDependencies } from './removeFunctionDependencies'

type Babel = { types: typeof types }

const { name } = require('../package.json')

function getConfigObjectExpression(
    variable: babel.NodePath<babel.types.VariableDeclarator>,
): babel.NodePath<babel.types.ObjectExpression> | null {
    const identifier = variable.get('id')
    const init = variable.get('init')
    if (
        identifier.isIdentifier() &&
        identifier.node.name === 'config' &&
        init.isObjectExpression()
    ) {
        return init
    } else {
        return null
    }
}

export function getConfigObject(
    program: babel.NodePath<babel.types.Program>,
): babel.NodePath<babel.types.ObjectExpression> | null {
    for (const statement of program.get('body')) {
        if (statement.isExportNamedDeclaration()) {
            const declaration = statement.get('declaration')
            if (
                declaration.isVariableDeclaration() &&
                declaration.node.kind === 'const'
            ) {
                for (const variable of declaration.get('declarations')) {
                    const configObject = getConfigObjectExpression(variable)
                    if (configObject) {
                        return configObject
                    }
                }
            }
        }
    }
    return null
}

// https://github.com/blitz-js/babel-plugin-superjson-next/blob/main/src/index.ts#L121C22-L121C22
function removeDefaultExport({
    program,
    isServer = false,
}: {
    program
    isServer?: boolean
}) {
    const body = program.get('body')

    const defaultDecl = body.find((path) => isExportDefaultDeclaration(path))
    if (!defaultDecl) {
        logger.log('no default export, skipping')
        return
    }
    const { node } = defaultDecl

    let defaultExportName = ''

    if (types.isIdentifier(node.declaration)) {
        defaultExportName = node.declaration.name
        defaultDecl.remove()

        if (isServer) {
            let nodeToRemove = body.find((path) => {
                if (types.isFunctionDeclaration(path.node)) {
                    return path.node.id?.name === defaultExportName
                }
                if (
                    types.isVariableDeclaration(path.node) &&
                    path.node?.declarations?.length === 1
                ) {
                    const decl = path.node.declarations[0]
                    if (types.isIdentifier(decl.id)) {
                        return decl.id.name === defaultExportName
                    }
                }
            })
            if (nodeToRemove) {
                logger.log(`removing func decl ${defaultExportName}`)
                nodeToRemove.remove()
            }
        }
    } else if (
        types.isFunctionDeclaration(node.declaration) &&
        node.declaration.id
    ) {
        defaultExportName = node.declaration.id.name
        if (isServer) {
            defaultDecl.remove()
        } else {
            defaultDecl.replaceInline(node.declaration)
        }
    } else {
        logger.log(`ignored ${node.declaration.type}`)
    }

    logger.log(`transformed default export`, defaultExportName)
    return defaultExportName
}

/**
 * transforms `export { default } from ".."` import & export line
 */
function transformImportExportDefault(paths: NodePath<any>[]) {
    for (const path of paths) {
        if (types.isExportNamedDeclaration(path) as any) {
            for (const specifier of path.node.specifiers) {
                logger.log(specifier.exported.name)
                if (specifier.exported.name === 'default') {
                    path.insertAfter(
                        types.exportDefaultDeclaration(
                            types.identifier(specifier.local.name),
                        ) as any,
                    )

                    path.node.specifiers.splice(
                        path.node.specifiers.indexOf(specifier),
                        1,
                    )

                    if (path.node.specifiers.length === 0) {
                        path.remove()
                    }
                }
            }
        }
    }
}

export function getFileName(state: PluginPass) {
    const { filename, cwd } = state

    if (!filename) {
        return undefined
    }

    if (cwd && filename.startsWith(cwd)) {
        return filename.slice(cwd.length + 1)
    }

    return filename
}

export interface PluginOptions {
    isServer: boolean
    testing?: string
    pagesDir: string
    dev: boolean
    apiDir: string
    basePath: string
}

export default function (
    { types: t }: Babel,
    { apiDir, pagesDir, isServer, testing, basePath }: PluginOptions,
): babel.PluginObj {
    return {
        visitor: {
            CallExpression(path) {
                if (isReactCall(path)) {
                    annotateAsPure(path)
                }
            },

            // Directive(path) {
            //     const { node } = path

            //     if (node.value.value === elaccaDirective) {
            //         path.remove()
            //     }
            // },
            Program(program, state) {
                const filePath =
                    getFileName(state) ?? nodePath.join('pages', 'Default.js')
                logger.log('transforming', filePath)

                if (shouldBeSkipped(filePath, program)) {
                    logger.log('skipping because not a page', filePath)
                    return
                }

                transformImportExportDefault(program.get('body'))

                const pageComponentName = removeDefaultExport({
                    program,
                    isServer,
                })
                if (!pageComponentName) {
                    logger.log('no page component name found, skipping')
                    return
                }

                if (isServer) {
                    removeFunctionDependencies({
                        name: pageComponentName,
                        path: program,
                        state,
                    })
                }

                // add a `export default renamedPage` at the end
                if (isServer) {
                    program.node.body?.push(
                        parse(dedent`
                        function ${defaultExportName}() {
                            return null
                        }
                    `).program.body[0] as any,
                    )
                } else {
                    // add import React from react
                    const reactImport = addNamedImport(
                        program,
                        'default',
                        'react',
                        {},
                    )
                    program.node.body?.push(
                        parse(
                            dedent`
                        function ${defaultExportName}(props) {
                            const [isMounted, setIsMounted] = ${reactImport.name}.useState(false)
                            ${reactImport.name}.useEffect(() => {
                                setIsMounted(true)
                            }, [])
                            return isMounted ? ${reactImport.name}.createElement(${pageComponentName}, props) : null
                        }
                        `,
                        ).program.body[0] as any,
                    )
                }

                program.node.body?.push(
                    types.exportDefaultDeclaration(
                        types.identifier(defaultExportName),
                    ),
                )
            },
        },
    }
}

const filesToSkip = ([] as string[]).concat(
    ...['_document', '_error'].map((name) => [
        name + '.js',
        name + '.jsx',
        name + '.ts',
        name + '.tsx',
    ]),
)

export function shouldBeSkipped(filePath: string, program) {
    if (!filePath.includes('pages' + path.sep)) {
        return true
    }
    if (filePath.includes('pages' + path.sep + 'api' + path.sep)) {
        return true
    }
    if (filesToSkip.some((fileToSkip) => filePath.includes(fileToSkip))) {
        return true
    }
    const dir = program.node.directives?.find(
        (x) => x.value?.value === elaccaDirective,
    )
    if (!dir) {
        return true
    }
    return false
}
