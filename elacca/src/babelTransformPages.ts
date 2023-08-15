import { annotateAsPure, literalToAst } from './astUtils'
import { addNamed as addNamedImport } from '@babel/helper-module-imports'

import type { NodePath, PluginObj, PluginPass } from '@babel/core'

import path from 'path'
import nodePath from 'path'
import fs from 'fs'
import * as babel from '@babel/core'
import * as types from '@babel/types'
import { WrapMethodMeta } from './server'
import { parse } from '@babel/parser'
import generate from '@babel/generator'
import { isExportDefaultDeclaration } from '@babel/types'
import dedent from 'dedent'

type Babel = { types: typeof types }
type BabelTypes = typeof babel.types

const { name } = require('../package.json')
const IMPORT_PATH_SERVER = `${name}/dist/server`
const IMPORT_PATH_BROWSER = `${name}/dist/browser`

function isAllowedTsExportDeclaration(
    declaration: babel.NodePath<babel.types.Declaration | null | undefined>,
): boolean {
    return (
        declaration.isTSTypeAliasDeclaration() ||
        declaration.isTSInterfaceDeclaration()
    )
}

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

function codeToAst(code: string) {
    return parse(code, { sourceType: 'module' }).program.body[0]['expression']
}

function isElacca(code: string) {
    // https://regex101.com/r/Wm6UvV/1
    return /^("|')skip ssr("|')(;?)\n/m.test(code)
}
function isClientComponent(code: string) {
    // https://regex101.com/r/Wm6UvV/1
    return /^("|')use client("|')(;?)\n/m.test(code)
}

const defaultExportName = 'DefaultExportRenamedByElacca'

// https://github.com/blitz-js/babel-plugin-superjson-next/blob/main/src/index.ts#L121C22-L121C22
function removeDefaultExport(path: NodePath<any>) {
    const { node } = path

    let defaultExportName = ''

    if (types.isIdentifier(node.declaration)) {
        defaultExportName = node.declaration.name
        path.remove()
    } else if (
        types.isFunctionDeclaration(node.declaration) &&
        node.declaration.id
    ) {
        defaultExportName = node.declaration.name
        // console.log(node.declaration.type)
        defaultExportName = node.declaration.id.name
        path.replaceInline(node.declaration)
    } else {
        console.log(`ignored ${node.declaration.type}`)
    }

    console.log({ defaultExportName })
    return defaultExportName

    // if (
    //     types.isFunctionDeclaration(node.declaration) ||
    //     types.isClassDeclaration(node.declaration)
    // ) {
    //     if (node.declaration.id) {
    //         // path.replaceInline(node.declaration)
    //         // ;(path.parentPath as NodePath<types.Program>).pushContainer(
    //         //     'body',
    //         //     types.exportDefaultDeclaration(node.declaration.id) as any,
    //         // )
    //     } else {
    //         node.declaration.id = types.identifier(defaultExportName)
    //         if (types.isFunctionDeclaration(node.declaration)) {
    //             node.declaration = functionDeclarationToExpression(
    //                 node.declaration,
    //             )
    //         } else {
    //             node.declaration = classDeclarationToExpression(
    //                 node.declaration,
    //             )
    //         }
    //     }
    // } else {
    //     // TODO handle other cases?
    //     console.log(`ignored ${node.declaration.type}`)
    //     node.declaration = node.declaration
    // }
}

/**
 * transforms `export { default } from ".."` import & export line
 */
function transformImportExportDefault(paths: NodePath<any>[]) {
    for (const path of paths) {
        if (types.isExportNamedDeclaration(path) as any) {
            for (const specifier of path.node.specifiers) {
                console.log(specifier.exported.name)
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

function getFileName(state: PluginPass) {
    const { filename, cwd } = state

    if (!filename) {
        return undefined
    }

    if (cwd && filename.startsWith(cwd)) {
        return filename.slice(cwd.length)
    }

    return filename
}

function functionDeclarationToExpression(
    declaration: types.FunctionDeclaration,
) {
    return types.functionExpression(
        declaration.id,
        declaration.params,
        declaration.body,
        declaration.generator,
        declaration.async,
    )
}

function classDeclarationToExpression(declaration: types.ClassDeclaration) {
    return types.classExpression(
        declaration.id,
        declaration.superClass,
        declaration.body,
        declaration.decorators,
    )
}

function hasWrapMethod(code: string) {
    return (
        /export\s+function\s+wrapMethod\s*\(/m.test(code) ||
        /export\s+(let|const)\s+wrapMethod\s*/m.test(code) ||
        // https://regex101.com/r/nRaEVs/1
        /export\s+\{[^}]*wrapMethod/m.test(code)
    )
}

function isEdgeInConfig(
    configObject: babel.NodePath<babel.types.ObjectExpression>,
): boolean {
    if (!configObject) {
        return false
    }
    for (const property of configObject.get('properties')) {
        if (!property.isObjectProperty()) {
            continue
        }
        const key = property.get('key')
        const value = property.get('value')

        if (
            property.isObjectProperty() &&
            key.isIdentifier({ name: 'runtime' }) &&
            value.isStringLiteral({ value: 'edge' })
        ) {
            return true
        }
    }
    return false
}

export interface PluginOptions {
    isServer: boolean
    pagesDir: string
    dev: boolean
    apiDir: string
    basePath: string
}

export default function (
    { types: t }: Babel,
    { apiDir, pagesDir, isServer, basePath }: PluginOptions,
): babel.PluginObj {
    return {
        visitor: {
            Program(program, state) {
                const { testing } = (state.opts as any) || {}

                const filePath =
                    getFileName(state) ?? nodePath.join('pages', 'Default.js')

                if (!testing && shouldBeSkipped(filePath)) {
                    return
                }

                transformImportExportDefault(program.get('body'))

                const body = program.get('body')

                const exportDefaultDeclaration = body.find((path) =>
                    isExportDefaultDeclaration(path),
                )
                if (!exportDefaultDeclaration) {
                    console.log('no default export, skipping')
                    return
                }

                const pageComponent = removeDefaultExport(
                    exportDefaultDeclaration,
                )
                if (!pageComponent) {
                    console.log('no page component name found, skipping')
                    return
                }

                // add import React from react
                const reactImport = addNamedImport(
                    program,
                    'default',
                    'react',
                    {},
                )

                // add a `export default renamedPage` at the end
                if (isServer) {
                    program.node.body.push(
                        parse(dedent`
                        function ${defaultExportName}() {
                            return null
                        }
                    }`).program.body[0] as any,
                    )
                } else {
                    program.node.body.push(
                        parse(
                            dedent`
                        function ${defaultExportName}() {
                            const [isMounted, setIsMounted] = ${reactImport.name}.useState(false)
                            ${reactImport.name}.useEffect(() => {
                                setIsMounted(true)
                            }, [])
                            return isMounted ? ${reactImport.name}.createElement(${pageComponent}) : null
                        }
                        `,
                        ).program.body[0] as any,
                    )
                }

                program.node.body.push(
                    types.exportDefaultDeclaration(
                        types.identifier(defaultExportName),
                    ),
                )

                if (process.env.DEBUG_ACTIONS_BABEL_PLUGIN) {
                    // stringify the AST and print it
                    const output = generate(
                        program.node,
                        {
                            /* options */
                        },
                        // @ts-expect-error
                        this.file.code,
                    )
                    let p = program.resolve(
                        './plugin-outputs',
                        (isServer ? 'server-' : 'client-') +
                            program.basename(filePath),
                    )
                    fs.mkdirSync(program.dirname(p), { recursive: true })
                    fs.writeFileSync(p, output.code)
                }
            },
        },
    }
}

const filesToSkip = ([] as string[]).concat(
    ...['_app', '_document', '_error'].map((name) => [
        name + '.js',
        name + '.jsx',
        name + '.ts',
        name + '.tsx',
    ]),
)

function shouldBeSkipped(filePath: string) {
    if (!filePath.includes('pages' + path.sep)) {
        return true
    }
    if (filePath.includes('pages' + path.sep + 'api' + path.sep)) {
        return true
    }
    return filesToSkip.some((fileToSkip) => filePath.includes(fileToSkip))
}
