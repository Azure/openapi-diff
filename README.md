# How to install

```javascript
npm install -g oad@0.1.11
```

## git Usage

```bash
vishrut@visshamac openapi-diff $ oad compare --help
Commands:
  compare <old-spec> <new-spec>  Compares old and new open api specification for
                                 breaking changes.

Options:
  --version          Show version number                               [boolean]
  -l, --logLevel     Set the logging level for console.
  [choices: "off", "json", "error", "warn", "info", "verbose", "debug", "silly"]
                                                               [default: "warn"]
  -f, --logFilepath  Set the log file path. It must be an absolute filepath. By
                     default the logs will stored in a timestamp based log file
                     at "/Users/vishrut/oad_output".
  -j, --inJson       A boolean flag indicating whether output format of the
                     messages is json.                 [boolean] [default: true]
  -h, --help         Show help                                         [boolean]
```

## Build dependencies

* [Node](https://nodejs.org) (7.10.0 or higher)
* [Node Package Manager](https://www.npmjs.com/package/npm)
* [.NET CLI tools](https://github.com/dotnet/cli/releases) version 2.0.0 or higher
  > You want the **.NET Core SDK Binaries** for your platform <br>
  >
  > `dotnet --version` <br>
 > `2.0.2` <br>

## Build scripts

### How to build

The first step would be to run `npm install` so we have all the required modules installed.

#### How to build the whole repo

```javascript
gulp;
```

### How to test

To run all tests under the repo

```javascript
gulp test
```

### How to bundle node package & install

```javascript
gulp pack
npm install -g oad-0.1.0.tgz
```

# Contributing

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
