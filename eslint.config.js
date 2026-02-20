// @ts-check

// This file contents based on:
// https://typescript-eslint.io/getting-started#step-2-configuration
// https://typescript-eslint.io/getting-started/typed-linting

// This file must be in CommonJS format ('require()') instead of ESModules ('import') due to how it is consumed
// by openapi-alps:
// https://github.com/Azure/openapi-diff/pull/335/files#r1649413983

const eslint = require("@eslint/js")
const tseslint = require("typescript-eslint")

module.exports = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        // Note: __dirname is coming CommonJS:
        // https://stackoverflow.com/questions/46745014/alternative-for-dirname-in-node-js-when-using-es6-modules
        // as linked from: https://typescript-eslint.io/getting-started/typed-linting
        tsconfigRootDir: __dirname
      }
    }
  },
  {
    // Based on https://eslint.org/docs/latest/use/configure/configuration-files#globally-ignoring-files-with-ignores
    ignores: ["**/dist", "eslint.config.js"]
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
      "prefer-const": "off",
      // New v10 recommended rule requiring "{ cause }" on re-thrown errors.  Disabled because
      // the project targets ES2017, and TypeScript lacks the ErrorOptions type at that target level.
      "preserve-caught-error": "off"
    }
  }
)
