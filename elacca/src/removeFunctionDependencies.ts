import {
    NodePath,
    PluginObj,
    types as BabelTypes,
} from 'next/dist/compiled/babel/core'
import * as t from '@babel/types'

type PluginState = {
    refs: Set<NodePath<BabelTypes.Identifier>>
    isPrerender: boolean
    isServerProps: boolean
    done: boolean
}

// taken from here: https://github.com/vercel/next.js/blob/adc413b3fb09be41b30ff7a86481e8f42cbb5447/packages/next/src/build/babel/plugins/next-ssg-transform.ts
export function removeFunctionDependencies({
    name,
    path,
    state,
}): PluginObj<PluginState> {
    function getIdentifier(
        path:
            | NodePath<BabelTypes.FunctionDeclaration>
            | NodePath<BabelTypes.FunctionExpression>
            | NodePath<BabelTypes.ArrowFunctionExpression>,
    ): NodePath<BabelTypes.Identifier> | null {
        const parentPath = path.parentPath
        if (parentPath.type === 'VariableDeclarator') {
            const pp = parentPath as NodePath<BabelTypes.VariableDeclarator>
            const name = pp.get('id')
            return name.node.type === 'Identifier'
                ? (name as NodePath<BabelTypes.Identifier>)
                : null
        }

        if (parentPath.type === 'AssignmentExpression') {
            const pp = parentPath as NodePath<BabelTypes.AssignmentExpression>
            const name = pp.get('left')
            return name.node.type === 'Identifier'
                ? (name as NodePath<BabelTypes.Identifier>)
                : null
        }

        if (path.node.type === 'ArrowFunctionExpression') {
            return null
        }

        return path.node.id && path.node.id.type === 'Identifier'
            ? (path.get('id') as NodePath<BabelTypes.Identifier>)
            : null
    }

    function isIdentifierReferenced(
        ident: NodePath<BabelTypes.Identifier>,
    ): boolean {
        const b = ident.scope.getBinding(ident.node.name)
        if (b?.referenced) {
            // Functions can reference themselves, so we need to check if there's a
            // binding outside the function scope or not.
            if (b.path.type === 'FunctionDeclaration') {
                return !b.constantViolations
                    .concat(b.referencePaths)
                    // Check that every reference is contained within the function:
                    .every((ref) => ref.findParent((p) => p === b.path))
            }

            return true
        }
        return false
    }

    function markFunction(
        path:
            | NodePath<BabelTypes.FunctionDeclaration>
            | NodePath<BabelTypes.FunctionExpression>
            | NodePath<BabelTypes.ArrowFunctionExpression>,
        state: PluginState,
    ): void {
        const ident = getIdentifier(path)
        if (ident?.node && isIdentifierReferenced(ident)) {
            state.refs.add(ident)
        }
    }

    function markImport(
        path:
            | NodePath<BabelTypes.ImportSpecifier>
            | NodePath<BabelTypes.ImportDefaultSpecifier>
            | NodePath<BabelTypes.ImportNamespaceSpecifier>,
        state: PluginState,
    ): void {
        const local = path.get('local') as NodePath<BabelTypes.Identifier>
        if (isIdentifierReferenced(local)) {
            state.refs.add(local)
        }
    }
    state.refs = new Set<NodePath<BabelTypes.Identifier>>()
    
    state.done = false
    const isDataIdentifier = (
        thisName: string,
        state: PluginState,
    ): boolean => {
        console.log('isDataIdentifier', thisName)
        // return true if it is the default export
        return thisName === name
    }
    path.traverse(
        {
            VariableDeclarator(variablePath, variableState) {
                if (variablePath.node.id.type === 'Identifier') {
                    const local = variablePath.get(
                        'id',
                    ) as NodePath<BabelTypes.Identifier>
                    if (isIdentifierReferenced(local)) {
                        variableState.refs.add(local)
                    }
                } else if (variablePath.node.id.type === 'ObjectPattern') {
                    const pattern = variablePath.get(
                        'id',
                    ) as NodePath<BabelTypes.ObjectPattern>

                    const properties = pattern.get('properties')
                    properties.forEach((p) => {
                        const local = p.get(
                            p.node.type === 'ObjectProperty'
                                ? 'value'
                                : p.node.type === 'RestElement'
                                ? 'argument'
                                : (function () {
                                      throw new Error('invariant')
                                  })(),
                        ) as NodePath<BabelTypes.Identifier>
                        if (isIdentifierReferenced(local)) {
                            variableState.refs.add(local)
                        }
                    })
                } else if (variablePath.node.id.type === 'ArrayPattern') {
                    const pattern = variablePath.get(
                        'id',
                    ) as NodePath<BabelTypes.ArrayPattern>

                    const elements = pattern.get('elements')
                    elements.forEach((e) => {
                        let local: NodePath<BabelTypes.Identifier>
                        if (e.node?.type === 'Identifier') {
                            local = e as NodePath<BabelTypes.Identifier>
                        } else if (e.node?.type === 'RestElement') {
                            local = e.get(
                                'argument',
                            ) as NodePath<BabelTypes.Identifier>
                        } else {
                            return
                        }

                        if (isIdentifierReferenced(local)) {
                            variableState.refs.add(local)
                        }
                    })
                }
            },
            FunctionDeclaration: markFunction,
            FunctionExpression: markFunction,
            ArrowFunctionExpression: markFunction,
            ImportSpecifier: markImport,
            ImportDefaultSpecifier: markImport,
            ImportNamespaceSpecifier: markImport,
            ExportNamedDeclaration(exportNamedPath, exportNamedState) {
                const specifiers = exportNamedPath.get('specifiers')
                if (specifiers.length) {
                    specifiers.forEach((s) => {
                        if (
                            isDataIdentifier(
                                t.isIdentifier(s.node.exported)
                                    ? s.node.exported.name
                                    : s.node.exported.value,
                                exportNamedState,
                            )
                        ) {
                            s.remove()
                        }
                    })

                    if (exportNamedPath.node.specifiers.length < 1) {
                        exportNamedPath.remove()
                    }
                    return
                }

                const decl = exportNamedPath.get('declaration') as NodePath<
                    | BabelTypes.FunctionDeclaration
                    | BabelTypes.VariableDeclaration
                >
                if (decl == null || decl.node == null) {
                    return
                }

                switch (decl.node.type) {
                    case 'FunctionDeclaration': {
                        const name = decl.node.id!.name
                        if (isDataIdentifier(name, exportNamedState)) {
                            exportNamedPath.remove()
                        }
                        break
                    }
                    case 'VariableDeclaration': {
                        const inner = decl.get(
                            'declarations',
                        ) as NodePath<BabelTypes.VariableDeclarator>[]
                        inner.forEach((d) => {
                            if (d.node.id.type !== 'Identifier') {
                                return
                            }
                            const name = d.node.id.name
                            if (isDataIdentifier(name, exportNamedState)) {
                                d.remove()
                            }
                        })
                        break
                    }
                    default: {
                        break
                    }
                }
            },
        },
        state,
    )

    const refs = state.refs
    let count: number

    function sweepFunction(
        sweepPath:
            | NodePath<BabelTypes.FunctionDeclaration>
            | NodePath<BabelTypes.FunctionExpression>
            | NodePath<BabelTypes.ArrowFunctionExpression>,
    ): void {
        const ident = getIdentifier(sweepPath)
        if (ident?.node && refs.has(ident) && !isIdentifierReferenced(ident)) {
            ++count

            if (
                t.isAssignmentExpression(sweepPath.parentPath) ||
                t.isVariableDeclarator(sweepPath.parentPath)
            ) {
                sweepPath.parentPath.remove()
            } else {
                sweepPath.remove()
            }
        }
    }

    function sweepImport(
        sweepPath:
            | NodePath<BabelTypes.ImportSpecifier>
            | NodePath<BabelTypes.ImportDefaultSpecifier>
            | NodePath<BabelTypes.ImportNamespaceSpecifier>,
    ): void {
        const local = sweepPath.get('local') as NodePath<BabelTypes.Identifier>
        if (refs.has(local) && !isIdentifierReferenced(local)) {
            ++count
            sweepPath.remove()
            if (
                (sweepPath.parent as BabelTypes.ImportDeclaration).specifiers
                    .length === 0
            ) {
                sweepPath.parentPath.remove()
            }
        }
    }

    do {
        ;(path.scope as any).crawl()
        count = 0

        path.traverse({
            // eslint-disable-next-line no-loop-func
            VariableDeclarator(variablePath) {
                if (variablePath.node.id.type === 'Identifier') {
                    const local = variablePath.get(
                        'id',
                    ) as NodePath<BabelTypes.Identifier>
                    if (refs.has(local) && !isIdentifierReferenced(local)) {
                        ++count
                        variablePath.remove()
                    }
                } else if (variablePath.node.id.type === 'ObjectPattern') {
                    const pattern = variablePath.get(
                        'id',
                    ) as NodePath<BabelTypes.ObjectPattern>

                    const beforeCount = count
                    const properties = pattern.get('properties')
                    properties.forEach((p) => {
                        const local = p.get(
                            p.node.type === 'ObjectProperty'
                                ? 'value'
                                : p.node.type === 'RestElement'
                                ? 'argument'
                                : (function () {
                                      throw new Error('invariant')
                                  })(),
                        ) as NodePath<BabelTypes.Identifier>

                        if (refs.has(local) && !isIdentifierReferenced(local)) {
                            ++count
                            p.remove()
                        }
                    })

                    if (
                        beforeCount !== count &&
                        pattern.get('properties').length < 1
                    ) {
                        variablePath.remove()
                    }
                } else if (variablePath.node.id.type === 'ArrayPattern') {
                    const pattern = variablePath.get(
                        'id',
                    ) as NodePath<BabelTypes.ArrayPattern>

                    const beforeCount = count
                    const elements = pattern.get('elements')
                    elements.forEach((e) => {
                        let local: NodePath<BabelTypes.Identifier>
                        if (e.node?.type === 'Identifier') {
                            local = e as NodePath<BabelTypes.Identifier>
                        } else if (e.node?.type === 'RestElement') {
                            local = e.get(
                                'argument',
                            ) as NodePath<BabelTypes.Identifier>
                        } else {
                            return
                        }

                        if (refs.has(local) && !isIdentifierReferenced(local)) {
                            ++count
                            e.remove()
                        }
                    })

                    if (
                        beforeCount !== count &&
                        pattern.get('elements').length < 1
                    ) {
                        variablePath.remove()
                    }
                }
            },
            FunctionDeclaration: sweepFunction,
            FunctionExpression: sweepFunction,
            ArrowFunctionExpression: sweepFunction,
            ImportSpecifier: sweepImport,
            ImportDefaultSpecifier: sweepImport,
            ImportNamespaceSpecifier: sweepImport,
        })
    } while (count)
}
