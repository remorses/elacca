import type { NodePath, PluginPass } from '@babel/core'

import annotateAsPure from '@babel/helper-annotate-as-pure'
import { types as t } from '@babel/core'

const enabled = !!process.env.DEBUG_ELACCA
export const logger = {
    log(...args) {
        enabled && console.log('[elacca]:', ...args)
    },
    error(...args) {
        enabled && console.log('[elacca]:', ...args)
    },
}

export const defaultExportName = 'DefaultExportRenamedByElacca'

// https://github.com/babel/babel/blob/main/packages/babel-plugin-transform-react-pure-annotations/src/index.ts
export function isReactCall(path: NodePath<t.CallExpression>) {
    // If the callee is not a member expression, then check if it matches
    // a named import, e.g. `import {forwardRef} from 'react'`.
    const calleePath = path.get('callee')
    if (!calleePath.isMemberExpression()) {
        for (const [module, methods] of PURE_CALLS) {
            for (const method of methods) {
                if (calleePath.referencesImport(module, method)) {
                    return true
                }
            }
        }

        return false
    }

    // Otherwise, check if the member expression's object matches
    // a default import (`import React from 'react'`) or namespace
    // import (`import * as React from 'react'), and check if the
    // property matches one of the pure methods.
    const object = calleePath.get('object')
    const callee = calleePath.node
    if (!callee.computed && t.isIdentifier(callee.property)) {
        const propertyName = callee.property.name
        for (const [module, methods] of PURE_CALLS) {
            if (
                object.referencesImport(module, 'default') ||
                object.referencesImport(module, '*')
            ) {
                return methods.has(propertyName)
            }
        }
    }

    return false
}

const PURE_CALLS: [string, Set<string>][] = [
    [
        'react',
        new Set([
            'cloneElement',
            'createContext',
            'createElement',
            'createFactory',
            'createRef',
            'forwardRef',
            'isValidElement',
            'memo',
            'lazy',
        ]),
    ],
    ['react-dom', new Set(['createPortal'])],
]
