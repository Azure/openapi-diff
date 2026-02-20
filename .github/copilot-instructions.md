# Copilot Instructions

## Project Overview

This repository contains the source code for `openapi-diff` (aka `oad`, aka `@azure/oad`), a breaking-change
detector tool for OpenAPI specifications. It is published as an npm package and is used internally by the
[azure-rest-api-specs](https://github.com/Azure/azure-rest-api-specs) and
[azure-rest-api-specs-pr](https://github.com/Azure/azure-rest-api-specs-pr) repos to validate PRs.

The core diff logic is written in C#/.NET and the CLI/validation layer is written in TypeScript.

## Tech Stack

- **TypeScript** (ES2017 target, CommonJS modules) — CLI, validation, and test code in `src/`
- **C#/.NET 6** — core diff engine in `openapi-diff/`
- **Node.js 20+**
- **Jest** with `ts-jest` for TypeScript tests
- **ESLint** (`typescript-eslint`) for linting
- **Prettier** for formatting
- **markdownlint** for Markdown style

## Setup

```sh
npm ci                # Install Node.js dependencies
npm run dn.restore    # Restore .NET dependencies (if working on C# code)
```

## Build

```sh
npm run tsc           # Build TypeScript code (outputs to dist/)
npm run dn.build      # Build C# code
```

## Lint and Format

```sh
npm run lint          # Run ESLint (zero warnings allowed)
npm run lint:fix      # Auto-fix ESLint issues
npm run prettier      # Check formatting with Prettier
npm run prettier:write # Auto-fix formatting
```

## Test

```sh
npm run ts.test       # Run TypeScript tests (Jest)
npm run dn.test       # Run C# tests (dotnet test)
npm test              # Run both C# and TypeScript tests
```

TypeScript tests live in `src/test/` and follow the naming pattern `*[tT]est.ts`.

## Code Conventions

- **No semicolons** — Prettier is configured with `"semi": false`
- **Print width** is 140 characters
- **Trailing commas** are not used (`"trailingComma": "none"`)
- **Arrow function parentheses** are avoided when possible (`"arrowParens": "avoid"`)
- **Strict TypeScript** — `tsconfig.json` has `"strict": true`
- **ESLint config** is in `eslint.config.js` (CommonJS format, not ESM)
- **Markdown line length** limit is 120 characters (tables and headings are exempt)
- Prefer `const` over `let` where possible

## Repository Structure

```
src/
  cli.ts              # CLI entry point
  index.ts            # Package entry point
  lib/
    commands/          # Command implementations
    util/              # Utility modules
    validate.ts        # Validation logic
    validators/        # Validator implementations
  test/                # TypeScript tests (Jest)
    specs/             # Test fixture OpenAPI spec files
openapi-diff/          # C#/.NET solution (core diff engine)
docs/                  # Documentation
```

## CI

CI runs on both Ubuntu and Windows via GitHub Actions (`.github/workflows/ci.yml`). It runs:
`npm run lint`, `npm run prettier`, and `npm test` (which includes both C# and TypeScript tests).

## Guidelines

- Run `npm run lint` and `npm run prettier` before submitting changes.
- Add or update tests in `src/test/` for any TypeScript code changes.
- Do not modify CI/CD pipeline files (`.github/workflows/`, `azure-pipelines.yml`) unless specifically required.
- When working only on TypeScript, use `npm run ts.test` to run just the TypeScript tests.
