// @ts-check

// This file contents based on:
// https://typescript-eslint.io/getting-started#step-2-configuration
// https://typescript-eslint.io/getting-started/typed-linting

import eslint from "@eslint/js"
import { dirname } from "path"
import tseslint from "typescript-eslint"
import { fileURLToPath } from "url"

// Needed to support Node < 20.11 per:
// https://stackoverflow.com/questions/46745014/alternative-for-dirname-in-node-js-when-using-es6-modules
// as linked from: https://typescript-eslint.io/getting-started/typed-linting
const __dirname = dirname(fileURLToPath(import.meta.url))

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname
      }
    }
  },
  {
    // Based on https://eslint.org/docs/latest/use/configure/configuration-files#globally-ignoring-files-with-ignores
    ignores: ["**/dist"]
  },
  {
    rules: {
      // Rules disabled as part of migration from tslint
      // https://github.com/Azure/openapi-diff/pull/335
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "no-constant-condition": "off",
      "no-useless-escape": "off",
      "prefer-const": "off"
    }
  }
)
