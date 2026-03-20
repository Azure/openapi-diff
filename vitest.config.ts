import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    include: ["**/*[tT]est.ts"],
    testTimeout: 100000,
    coverage: {
      enabled: true
    }
  }
})
