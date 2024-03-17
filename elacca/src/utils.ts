import { PluginPass } from "@babel/core"

const enabled = !!process.env.DEBUG_ELACCA
export const logger = {
    log(...args) {
        enabled && console.log('[elacca]:', ...args)
    },
    error(...args) {
        enabled && console.log('[elacca]:', ...args)
    },
}

export const elaccaDirective = 'skip ssr'




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