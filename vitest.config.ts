import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        setupFiles: ['dotenv/config'],
        outputFile: {
            junit: "junit.xml"
        },
        reporters: ["junit"],
        coverage: {
            provider: 'v8', // or 'istanbul'
            reporter: ["cobertura"],
            reportsDirectory: "./coverage"
        },
    },
})
