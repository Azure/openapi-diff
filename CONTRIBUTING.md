# Contributing

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact
[opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Table of contents

- [Contributing](#contributing)
  - [Table of contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Build the code](#build-the-code)
    - [Troubleshoot](#troubleshoot)
  - [Run `oad` locally from sources](#run-oad-locally-from-sources)
  - [Reproduce specs PR CI failure of `Swagger BreakingChange` or `BreakingChange(Cross-Version)`](#reproduce-specs-pr-ci-failure-of-swagger-breakingchange-or-breakingchangecross-version)
  - [Install `oad` globally from sources or npm feed](#install-oad-globally-from-sources-or-npm-feed)
    - [Uninstall `oad` globally](#uninstall-oad-globally)
  - [Purge the obsolete `oad` package from your system](#purge-the-obsolete-oad-package-from-your-system)
  - [Publish the package](#publish-the-package)

<!-- One of the few situations where usage of HTML is justified and it is not sanitized away by GitHub -->
<!-- markdownlint-disable MD033 -->
<small><i><a href='https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one'>
Table of contents generated with yzhang.markdown-all-in-one</a></i></small>

## Prerequisites

To execute any instructions in this file, first ensure you fulfill all the following prerequisites:

1. Install [Node.js](https://nodejs.org/), version 14.x or higher.
1. Install [.NET runtime and SDK](https://aka.ms/dotnet-download), version 6 or higher.
1. Install [.NET CLI tools](https://github.com/dotnet/cli/releases) version 2.0.0 or higher.
1. Execute all commands in this file from your [`openapi-diff`] git repo local clone root dir.
1. Run `npm ci` to install the required node modules.

## Build the code

`openapi-diff` is composed both of TypeScript and .NET/C# projects, all of which have to be built
to be able to run the tool locally from sources.

The core logic for `openapi-diff` is written in C# and compiled to a .NET binary.  
The CLI for `openapi-diff` is written in TypeScript and compiled to a Node.js binary.

| Build command | Effect |
|-|-|
| `npm run dn.build` | Runs [`dotnet build`] and related commands to build the C# code. |
| `npm run tsc` | Builds the TypeScript code. |

For more commands, see the [`package.json`](/package.json) `scripts` element.
Notably:

| Command | Effect |
|-|-|
| `npm run dn.restore` | Runs [`dotnet restore`] in preparation to build the C# code. |
| `npm run dn.test` | Runs [`dotnet test`] and related commands to test the C# code. |

### Troubleshoot

If the `npm run dn.build` command outputs error like:

> C:\Program Files\dotnet\sdk\8.0.100\Sdks\Microsoft.NET.Sdk\targets\Microsoft.PackageDependencyResolution.targe
       ts(266,5): error NETSDK1005: Assets file 'C:\(...)\openapi-diff\src\core\OpenApiDiff\ob
       j\project.assets.json' doesn't have a target for 'netcoreapp6.0'. Ensure that restore has run and that you have
       included 'netcoreapp6.0' in the TargetFrameworks for your project.

Then first run `npm run dn.restore` and then run the `npm run dn.build` command again.

## Run `oad` locally from sources

After you have built the C# and TypeScript code, you can run the `openapi-diff` aka `oad` tool locally.

1. Run [`npm link`] once.
2. Then you can use `oad` by running `oad -h`.

> [!CAUTION]
> Following commands have different behavior: `oad`, `oad -h`, `oad --help`.
> As of 11/2/2023 only `oad -h` appears to work as intended.

## Reproduce specs PR CI failure of `Swagger BreakingChange` or `BreakingChange(Cross-Version)`

If `Swagger BreakingChange` or  `BreakingChange(Cross-Version)` checks fail on your `Azure/azure-rest-api-specs[-pr]` PR,
you can reproduce the failure locally as follows:

- Open the GitHub check pane.
- Click the hyperlinked `View Azure DevOps build log for more details.` Open the relevant job (`BreakingChange` or `CrossVersionBreakingChange`)
  and a task within the job with the same name. Search for log `ENTER definition runOad`.
  This log will show you the `oldSpec` and `newSpec` values, which you can pass as input to `oad` when running it locally,
  per [Run `oad` locally from sources](#run-oad-locally-from-sources). 
  Note you will have to clone locally relevant git branches with the specs.

## Install `oad` globally from sources or npm feed

You can also install the `oad` tool globally and run it from anywhere.

```sh
npm list -g @azure/oad # verify oad is not installed globally
npm install -g # Install oad from local repo clone source
npm list -g @azure/oad # verify oad is installed 
oad --version # verify correct version got installed.
oad -h
```

> [!CAUTION]  
> Be careful to use `@azure/oad` and not `oad` as the latter is an obsolete, deprecated package.
<!-- markdownlint-disable MD028 -->
<!-- Disabling warning about empty line inside blockquote -->
> [!TIP]
> If you want to install `oad` not from your local sources, but the latest from the npm feed,
> use this alternative `npm install`:  
> `npm install -g @azure/oad`

### Uninstall `oad` globally

To uninstall `oad` globally:

``` sh
# if installed from sources
npm uninstall -g 
# if installed from npm feed
npm uninstall -g @azure/oad
```

## Purge the obsolete `oad` package from your system

To purge the obsolete, deprecated `oad` package from your system, including [the cache].

``` sh
# To remove oad from the cache
npm cache ls oad 
npm cache clean <copy paste here entries from "ls oad"> # run once per each entry from "ls oad"
npm cache verify # to fix the cache after removing oad

# To remove oad from the local node_modules
npm uninstall oad
npm list oad # Should denote no packages installed

# To remove oad from the global node_modules
npm uninstall -g oad
npm list -g oad # Should denote no packages installed
```

## Publish the package

- Ensure you bumped the package version in `openapi-diff` `package.json`.
- Verify [`public.openapi-diff`] passed.
- Use [`js - tools to npm - publish (@azure)`] to publish the package to the public `npm` feed.
- Verify in [`@azure/oad` versions] the package was published.
- Save it to `openapi-platform` feed via [upstream feeds of `openapi-platform`].
- To make `openapi-alps` use the newly published package:
  - Ensure that you update the relevant `package.json` files and then run `rush update` and commit the changes.
    - Example file: [`private/azure-swagger-validation/azureSwaggerValidation/package.json`][azureSwaggerValidation package.json]
    - Example `openapi-alps` PR doing the package update: [#537791]
  - Redeploy relevant `openapi-alps` parts to pick up the new package, even if you didn't had to commit any changes. Follow [this doc][openapi-alps doc].

[`openapi-diff`]: https://github.com/Azure/openapi-diff
[`dotnet restore`]: https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-restore
[`dotnet build`]: https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-build
[`dotnet test`]: https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-test
[`npm link`]: https://docs.npmjs.com/cli/v10/commands/npm-link
[the cache]: https://docs.npmjs.com/cli/v10/configuring-npm/folders#cache
[`js - tools to npm - publish (@azure)`]: https://dev.azure.com/azure-sdk/internal/_release?definitionId=24&_a=releases&view=mine
[`public.openapi-diff`]: https://dev.azure.com/azure-sdk/public/_build?definitionId=135&_a=summary
[upstream feeds of `openapi-platform`]: https://devdiv.visualstudio.com/DevDiv/_artifacts/feed/openapi-platform/Npm/@azure%2Foad/upstreams/
[`@azure/oad` versions]: https://www.npmjs.com/package/@azure/oad?activeTab=versions
[openapi-alps doc]: https://dev.azure.com/azure-sdk/internal/_wiki/wikis/internal.wiki/891/openapi-alps?anchor=testing-and-deploying-changes
[azureSwaggerValidation package.json]: https://devdiv.visualstudio.com/DevDiv/_git/openapi-alps?path=/private/azure-swagger-validation/azureSwaggerValidation/package.json&version=GC78491f959bc714d1a0d35060e58fa6c5888bb828&line=44&lineEnd=44&lineStartColumn=7&lineEndColumn=16&lineStyle=plain&_a=contents
[#537791]: https://devdiv.visualstudio.com/DevDiv/_git/openapi-alps/pullrequest/537791
