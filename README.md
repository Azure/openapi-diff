[![Build Status](https://dev.azure.com/azure-sdk/public/_apis/build/status/public.openapi-diff?branchName=master)](https://dev.azure.com/azure-sdk/public/_build/latest?definitionId=135&branchName=master)

# How to install

```javascript
npm install -g @azure/oad
```

# Usage

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
  -o, --oldTagName   The tag name for the old specification file.  If included it 
                     indicates that the old spec file is a readme file
  -n, --newTagName   The tag name for the new specification file.  If included it 
                     indicates that the new spec file is a readme file
```

# Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)
