import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        coverage: {
            provider: 'v8', // or 'istanbul'
            reporter: ['text', 'json', 'html'],
            reportsDirectory: "./coverage"
        },
    },
})
