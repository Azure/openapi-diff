# Default Configuration

This configuration applies to every run of AutoRest, but with less priority than any other specified configuration (i.e. it is overridable).

## Basic

``` yaml
azure-arm: false
output-folder: generated
openapi-type: arm
```

## Pipeline

### External Plugins

``` yaml $(azureresourceschema) && $(preview)
use-extension:
  "@microsoft.azure/autorest.azureresourceschema": "preview"
try-require: ./readme.azureresourceschema.md 
```


``` yaml $(azureresourceschema)
use-extension:
  "@microsoft.azure/autorest.azureresourceschema": "~2.0.14"
try-require: ./readme.azureresourceschema.md 
```

``` yaml $(csharp) && $(preview)
use-extension:
  "@microsoft.azure/autorest.csharp": "preview"
try-require: ./readme.csharp.md
```

``` yaml $(csharp)
use-extension:
  "@microsoft.azure/autorest.csharp": "~2.3.79"
try-require: ./readme.csharp.md
```

``` yaml $(jsonrpcclient)
use-extension:
  "@microsoft.azure/autorest.csharp": "~2.3.79"
```

``` yaml $(go) && $(preview)
use-extension:
  "@microsoft.azure/autorest.go": "preview"
try-require: ./readme.go.md
```

``` yaml $(go)
use-extension:
  "@microsoft.azure/autorest.go": "~2.1.47"
try-require: ./readme.go.md
```

``` yaml $(java) && $(preview)
use-extension:
  "@microsoft.azure/autorest.java": "~2.1.88"
try-require: ./readme.java.md
```

``` yaml $(java)
use-extension:
  "@microsoft.azure/autorest.java": "~2.1.88"
try-require: ./readme.java.md
```

``` yaml $(nodejs) && $(preview)
use-extension:
  "@microsoft.azure/autorest.nodejs": "preview"
try-require: ./readme.nodejs.md
```

``` yaml $(nodejs)
use-extension:
  "@microsoft.azure/autorest.nodejs": "~2.1.25"
try-require: ./readme.nodejs.md
```

``` yaml $(php) && preview
use-extension:
  "@microsoft.azure/autorest.php": "~2.0.12"
try-require: ./readme.php.md
```

``` yaml $(php)
use-extension:
  "@microsoft.azure/autorest.php": "~2.0.12"
try-require: ./readme.php.md
```

``` yaml $(python) && $(preview)
use-extension:
  "@microsoft.azure/autorest.python": "preview"
try-require: ./readme.python.md
```

``` yaml $(python) 
use-extension:
  "@microsoft.azure/autorest.python": "~3.0.56"
try-require: ./readme.python.md
```

``` yaml $(ruby) && $(preview)
use-extension:
  "@microsoft.azure/autorest.ruby": "preview"
try-require: ./readme.ruby.md
```
``` yaml $(ruby)
use-extension:
  "@microsoft.azure/autorest.ruby": "~3.1.26"
try-require: ./readme.ruby.md
```
 
``` yaml $(typescript) && $(preview)
use-extension:
  "@microsoft.azure/autorest.typescript": "preview"
try-require: ./readme.typescript.md   
```

``` yaml $(typescript)
use-extension:
  "@microsoft.azure/autorest.typescript": "~4.2.0"
try-require: ./readme.typescript.md   
```

``` yaml $(azure-validator)
use-extension:
  "@microsoft.azure/classic-openapi-validator": "~1.0.9"
  "@microsoft.azure/openapi-validator": "~1.0.2"
```

``` yaml $(model-validator)
use-extension:
 "oav": "~0.4.20"
```

``` yaml $(az)
use-extension:
 "@autorest/az": "latest"
try-require: ./readme.az.md   
```

### Graph

#### Reflection

##### Input API versions (azure-rest-api-specs + C# specific)

``` yaml $(csharp)
pipeline:
  swagger-document/reflect-api-versions-cs: # emits a *.cs file containing information about the API versions involved in this call
    input:
    - identity
    - individual/identity
    - csharp/emitter # ensures delay and C# scope
    scope: reflect-api-versions
  swagger-document/reflect-api-versions-cs/emitter: # emits the pipeline graph
    input: reflect-api-versions-cs
    scope: scope-reflect-api-versions-cs-emitter

scope-reflect-api-versions-cs-emitter:
  input-artifact: source-file-csharp
  output-uri-expr: $key
```

##### Pipeline

``` yaml
pipeline:
  pipeline-emitter: # emits the pipeline graph
    scope: scope-pipeline-emitter

scope-pipeline-emitter:
  input-artifact: pipeline
  is-object: true
  output-uri-expr: |
    "pipeline"
```

##### Configuration

``` yaml
pipeline:
  configuration-emitter: # emits the pipeline graph
    scope: scope-configuration-emitter

scope-configuration-emitter:
  input-artifact: configuration
  is-object: true
  output-uri-expr: |
    "configuration"
```

#### Help

``` yaml $(help)
input-file: dummy # trick "no input file" checks... may wanna refactor at some point

pipeline:
  help:
    scope: help

output-artifact:
  - help

help-content: # type: Help as defined in autorest-core/help.ts
  _autorest-0:
    categoryFriendlyName: Overall Verbosity
    settings:
    # - key: quiet
    #   description: suppress most output information
    - key: verbose
      description: display verbose logging information
    - key: debug
      description: display debug logging information
  _autorest-1:
    categoryFriendlyName: Manage Installation
    settings:
    - key: info # list-installed
      description: display information about the installed version of autorest and its extensions
    - key: list-available
      description: display available AutoRest versions
    - key: reset
      description: removes all autorest extensions and downloads the latest version of the autorest-core extension
    - key: preview
      description: enables using autorest extensions that are not yet released
    - key: latest
      description: installs the latest autorest-core extension
    - key: force
      description: force the re-installation of the autorest-core extension and frameworks
    - key: version
      description: use the specified version of the autorest-core extension
      type: string
  _autorest-core-0:
    categoryFriendlyName: Core Settings and Switches
    settings:
    - key: help
      description: display help (combine with flags like --csharp to get further details about specific functionality)
    - key: input-file
      type: string | string[]
      description: OpenAPI file to use as input (use this setting repeatedly to pass multiple files at once)
    - key: output-folder
      type: string
      description: "target folder for generated artifacts; default: \"<base folder>/generated\""
    - key: clear-output-folder
      description: clear the output folder before writing generated artifacts to disk (use with extreme caution!)
    - key: base-folder
      type: string
      description: "path to resolve relative paths (input/output files/folders) against; default: directory of configuration file, current directory otherwise"
    - key: message-format
      type: "\"regular\" | \"json\""
      description: "format of messages (e.g. from OpenAPI validation); default: \"regular\""
    - key: github-auth-token
      type: string
      description: OAuth token to use when pointing AutoRest at files living in a private GitHub repository
  _autorest-core-1:
    categoryFriendlyName: Core Functionality
    description: "> While AutoRest can be extended arbitrarily by 3rd parties (say, with a custom generator),\n> we officially support and maintain the following functionality.\n> More specific help is shown when combining the following switches with `--help` ."
    settings:
    - key: csharp
      description: generate C# client code
    - key: go
      description: generate Go client code
    - key: java
      description: generate Java client code
    - key: python
      description: generate Python client code
    - key: nodejs
      description: generate NodeJS client code
    - key: typescript
      description: generate TypeScript client code
    - key: ruby
      description: generate Ruby client code
    - key: php
      description: generate PHP client code
    - key: azureresourceschema
      description: generate Azure resource schemas
    - key: model-validator
      description: validates an OpenAPI document against linked examples (see https://github.com/Azure/azure-rest-api-specs/search?q=x-ms-examples )
    # - key: semantic-validator
    #   description: validates an OpenAPI document semantically
    - key: azure-validator
      description: validates an OpenAPI document against guidelines to improve quality (and optionally Azure guidelines)
```

Note: We don't load anything if `--help` is specified.

``` yaml !$(help)
perform-load: true # kick off loading
```

#### Loading

Markdown documentation overrides:

``` yaml
pipeline:
  swagger-document-override/md-override-loader:
    output-artifact: immediate-config
    scope: perform-load
```

OpenAPI definitions:

``` yaml
pipeline:
  swagger-document/loader:
    # plugin: loader # IMPLICIT: default to last item if split by '/'
    output-artifact: swagger-document
    scope: perform-load
  swagger-document/individual/transform:
    input: loader
    output-artifact: swagger-document
  swagger-document/individual/schema-validator:
    input: transform
    output-artifact: swagger-document
  swagger-document/individual/identity:
    input: schema-validator
    output-artifact: swagger-document
  swagger-document/compose:
    input: individual/identity
    output-artifact: swagger-document
  swagger-document/transform-immediate:
    input:
    - swagger-document-override/md-override-loader
    - compose
    output-artifact: swagger-document
  swagger-document/transform:
    input: transform-immediate
    output-artifact: swagger-document
  swagger-document/identity:
    input: transform
    output-artifact: swagger-document
  swagger-document/emitter:
    input: identity
    scope: scope-swagger-document/emitter


scope-swagger-document/emitter:
  input-artifact: swagger-document
  is-object: true
  # rethink that output-file part
  output-uri-expr: |
    $config["output-file"] || 
    ($config.namespace ? $config.namespace.replace(/:/g,'_') : undefined) || 
    $config["input-file"][0].split('/').reverse()[0].split('\\').reverse()[0].replace(/\.json$/, "")    

scope-cm/emitter: # can remove once every generator depends on recent modeler
  input-artifact: code-model-v1
  is-object: true
  output-uri-expr: |
    "code-model-v1"

```

``` yaml ! $(NoOaiConverter)
pipeline:    
  # OpenAPI
  openapi-document/openapi-document-converter:
    input: swagger-document/identity
    output-artifact: openapi-document
  openapi-document/transform:
    input: openapi-document-converter
    output-artifact: openapi-document
  openapi-document/component-modifiers:
    input: transform
    output-artifact: openapi-document
  openapi-document/identity:
    input: component-modifiers
    output-artifact: openapi-document
  openapi-document/emitter:
    input: identity
    scope: scope-openapi-document/emitter

scope-openapi-document/emitter:
  input-artifact: openapi-document
  is-object: true
  # rethink that output-file part
  output-uri-expr: |
    $config["output-file"] || 
    ($config.namespace ? $config.namespace.replace(/:/g,'_') : undefined) || 
    $config["input-file"][0].split('/').reverse()[0].split('\\').reverse()[0].replace(/\.json$/, "")
```

#### Polyfills


##### `additionalProperties: true/false` in definitions section

``` yaml
directive:
- from: swagger-document
  where: $.definitions.*.additionalProperties
  transform: |
    return typeof $ === "boolean"
      ? ($ ? { type: "object" } : undefined)
      : $
  reason: polyfill
```

##### Reproduce old buggy behavior of ignoring `required`ness of properties in nested schemas (anything outside `definitions` section)
See https://github.com/Azure/autorest/issues/2688

``` yaml $(ignore-nested-required)
directive:
- from: openapi-document
  where: $..*[?(Array.isArray(@.required) && @.properties)]
  transform: |
    if ($path.length > 3) delete $.required;
  reason: see issue https://github.com/Azure/autorest/issues/2688
```

#### Validation

``` yaml
pipeline:
  swagger-document/model-validator:
    input: swagger-document/identity
    scope: model-validator
  swagger-document/semantic-validator:
    input: swagger-document/identity
    scope: semantic-validator
```

# Validation

## Client Side Validation

On by default for backwards compatibility, but see https://github.com/Azure/autorest/issues/2100

``` yaml
client-side-validation: true
```

# Directives

The built-in `transform` directive with its filters `from` and `where` are very powerful, but can become verbose and thus hard to reuse for common patterns (e.g. rename an operation).
Furthermore, they usually rely on precise data formats (e.g. where to find operations in the `code-model-v1`) and thus break once the data format changes.
We propose the following mechanism of declaring directives similar to macros, which allows capturing commonly used directives in a more high-level way.
Configuration files using these macros instead of "low-level" directives are robust against changes in the data format as the declaration in here will be adjusted accordingly.

## How it works

A declaration such as

``` yaml false
declare-directive:
  my-directive: >-
    [
      {
        transform: `some transformer, parameterized with '${JSON.stringify($)}'`
      },
      {
        from: "code-model-v1"
        transform: `some other transformer, parameterized with '${JSON.stringify($)}'`
      }
    ]
```

can be used by naming it in a `directive` section:

``` yaml false
directive:
  - my-directive: # as a standalone, with an object as parameter
      foo: bar
      baz: 42
  - from: a
    where: b
    my-directive: 42 # together with other stuff, with a number as parameter
```

Each `directive` entry that names `my-directive` will be expanded with the whatever the declaration evaluates to, where `$` is substituted with the value provided to the directive when used.
If the declaration evaluates to an array, the directives are duplicated accordingly (this enables directive declarations that transform data on multiple stages).
In the above example, `directive` gets expanded to:

``` yaml false
directive:
  - transform: >-
      some transformer, parameterized with '{ "foo": \"bar\", "baz": 42 }'
  - from: code-model-v1
    transform: >-
      some other transformer, parameterized with '{ "foo": \"bar\", "baz": 42 }'
  - from: a
    where: b
    transform: >-
      some transformer, parameterized with '42'
  - from: a
    where: b
    transform: >-
      some other transformer, parameterized with '42'
```

As can be seen in the last `directive`, `from` as specified originally was not overridden by `code-model-v1`, i.e. what was specified by the user is given higher priority.


## `set`

Formerly implemented in the AutoRest core itself, `set` is now just syntactic sugar for `transform`.

``` yaml
declare-directive:
  set: >-
    { transform: `return ${JSON.stringify($)}` }
```

## Operations

### Selection

Select operations by ID at different stages of the pipeline.

``` yaml
declare-directive:
  where-operation: >-
    (() => {
      switch ($context.from) {
        case "code-model-v1":
          return { from: "code-model-v1", where: `$.operations[*].methods[?(@.serializedName == ${JSON.stringify($)})]` };
        case "swagger-document":
        default:
          return { from: "swagger-document", where: `$.paths.*[?(@.operationId == ${JSON.stringify($)})]` };
      }
    })()
  where-model: >-
    (() => {
      switch ($context.from) {
        case "code-model-v1":
          throw "not implemented";
        case "swagger-document":
        default:
          return { from: "swagger-document", where: `$.definitions[${JSON.stringify($)}]` };
      }
    })()
```

## Removal

Removes an operation by ID.

``` yaml
declare-directive:
  remove-operation: >-
    {
      from: 'swagger-document',
      "where-operation": $,
      transform: 'return undefined'
    }
  rename-operation: >-
    {
      from: 'swagger-document',
      "where-operation": $.from,
      transform: `$.operationId = ${JSON.stringify($.to)}`
    }
  remove-model: >-
    {
      from: 'swagger-document',
      "where-model": $,
      transform: 'return undefined'
    }
  rename-model: >-
    [{
      from: 'swagger-document',
      where: '$.definitions',
      transform: `if ($[${JSON.stringify($.from)}]) { $[${JSON.stringify($.to)}] = $[${JSON.stringify($.from)}]; delete $[${JSON.stringify($.from)}]; }`
    },
    {
      from: 'swagger-document',
      where: `$..['$ref']`,
      transform: `$ = $ === "#/definitions/${$.from}" ? "#/definitions/${$.to}" : $`
    }]
  remove-property: >-
    {
      from: 'swagger-document',
      transform: `delete $.properties[${JSON.stringify($)}]`
    }
  rename-property: >-
    {
      from: 'swagger-document',
      transform: `if ($.properties[${JSON.stringify($.from)}]) { $.properties[${JSON.stringify($.to)}] = $.properties[${JSON.stringify($.from)}]; delete $.properties[${JSON.stringify($.from)}]; }`
    }
```

``` yaml
# preserve files that have been asked to preserve
output-artifact:
  - preserved-files
```
