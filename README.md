# About openapi-diff

[![Build Status][build status]][build pipeline]

This repository contains source code of `openapi-diff` aka `oad` aka "Breaking change detector tool" npm package.
This package is invoked internally by the [azure-rest-api-specs] and [azure-rest-api-specs-pr] repos
`Swagger Breaking Change` and `Breaking Change(Cross-Version)` GitHub checks, validating PRs submitted to them.

For description of the overall process of which `oad` is part of, see https://aka.ms/azsdk/specreview.

[build status]: https://dev.azure.com/azure-sdk/public/_apis/build/status/public.openapi-diff?branchName=main
[build pipeline]: https://dev.azure.com/azure-sdk/public/_build/latest?definitionId=135&branchName=main
[azure-rest-api-specs]: https://github.com/Azure/azure-rest-api-specs
[azure-rest-api-specs-pr]: https://github.com/Azure/azure-rest-api-specs-pr

## npm package

- [@azure/oad] ![npm package version shield](https://img.shields.io/npm/v/@azure/oad)
- [package.json]

> [!CAUTION]  
> Do not use the package [oad] ![npm package version shield](https://img.shields.io/npm/v/oad). It is deprecated and obsolete.

[@azure/oad]: https://www.npmjs.com/package/@azure/oad
[package.json]: /package.json
[oad]: https://www.npmjs.com/package/oad

## How to run locally

See relevant section in [CONTRIBUTING.md](./CONTRIBUTING.md)

