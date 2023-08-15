import { addNamed as addNamedImport } from '@babel/helper-module-imports'

import type { NodePath, PluginPass } from '@babel/core'

import * as babel from '@babel/core'
import generate from '@babel/generator'
import { parse } from '@babel/parser'
import * as types from '@babel/types'
import { isExportDefaultDeclaration } from '@babel/types'
import dedent from 'dedent'
import fs from 'fs'
import { default as nodePath, default as path } from 'path'

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
            Program(program, state) {
                const filePath =
                    getFileName(state) ?? nodePath.join('pages', 'Default.js')

                if (shouldBeSkipped(filePath)) {
                    console.log('skipping because not a page', filePath)
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

                if (
                    !program.node.directives?.find(
                        (x) => x.value?.value === 'skip ssr',
                    )
                ) {
                    console.log('no skip ssr, skipping')
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
                    `).program.body[0] as any,
                    )
                } else {
                    program.node.body.push(
                        parse(
                            dedent`
                        function ${defaultExportName}(props) {
                            const [isMounted, setIsMounted] = ${reactImport.name}.useState(false)
                            ${reactImport.name}.useEffect(() => {
                                setIsMounted(true)
                            }, [])
                            return isMounted ? ${reactImport.name}.createElement(${pageComponent}, props) : null
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
