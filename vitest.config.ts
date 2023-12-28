import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        setupFiles: ['dotenv/config'],
        outputFile: {
            junit: "junit.xml",
            html: "./coverage/index.html"
        },
        reporters: ["html", "junit"],
        coverage: {
            provider: 'v8', // or 'istanbul'
            reporter: ["cobertura"],
            reportsDirectory: "./coverage"
        },
    },
})
