// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
    esbuild: {
        jsx: 'transform',
    },
    forceRerunTriggers: ['elacca/src/**/*.ts',],
    test: {
        exclude: ['**/dist/**', '**/esm/**', '**/node_modules/**', '**/e2e/**'],
    },
})
