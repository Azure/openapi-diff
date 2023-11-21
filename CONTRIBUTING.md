# Contributing

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Prerequisites

- [Node.js](https://nodejs.org/) (14.x or higher)
- [.NET runtime and SDK](https://aka.ms/dotnet-download)
- [.NET CLI tools](https://github.com/dotnet/cli/releases) version 2.0.0 or higher

## Build scripts

Run `npm install` to install the required modules.

```sh
npm install
```

## How to build the C# code

The core logic for openapi-diff is written in C# and compiled to a .NET binary.

Use `dn.build` npm script to build the C# code.

```sh
npm run dn.build
```

## How to test the C# code

To run all tests under the repo

```sh
npm run dn.test
```

## How to build the TypeScript code

The CLI for openapi-diff is written in TypeScript and compiled to a Node.js binary.

Use `tsc` npm script to build the TypeScript code.

```sh
npm run tsc
```

## How to run locally

After you have built the C# and TypeScript code, you can run the openapi-diff tool locally.
To run the openapi-diff tool locally, use the `npm run start` command.

```sh
node dist/cli.js --help
```

You can also install the package globally and run it from anywhere.

```sh
npm install -g
oad --help
```
