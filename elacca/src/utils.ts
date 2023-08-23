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
