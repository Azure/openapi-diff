// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.


import * as util from "util"
import * as path from "path"
import * as os from "os"
import { log as log } from "../util/logging"
import * as fs from "fs"
import * as asyncFs from "@ts-common/fs"
import * as child_process from "child_process"
import * as sourceMap from "source-map"
import * as jsonParser from "@ts-common/json-parser"
import * as jsonRefs from "json-refs"

const exec = util.promisify(child_process.exec)

export type Options = {
  readonly consoleLogLevel?: unknown
  readonly logFilepath?: unknown
}

export type ProcessedFile = {
  readonly fileName: string
  readonly map: sourceMap.BasicSourceMapConsumer | sourceMap.IndexedSourceMapConsumer
}

type ChangeProperties = {
  readonly location?: string
  readonly path?: string
  readonly ref?: string
}

type Message = {
  readonly id: string
  readonly code: string
  readonly docUrl: string
  readonly message: string
  readonly mode: string
  readonly type: string
  readonly new: ChangeProperties
  readonly old: ChangeProperties
}

type Messages = ReadonlyArray<Message>

const updateChangeProperties = (change: ChangeProperties, pf: ProcessedFile): ChangeProperties => {
  if (change.location) {
    const s = change.location.split(":")
    const position = { line: parseInt(s[s.length - 2]), column: parseInt(s[s.length - 1]) - 1 }
    const originalPosition = pf.map.originalPositionFor(position)
    const name = originalPosition.name as string
    const namePath = name.split("\n")[0]
    const parsedPath = JSON.parse(namePath) as string[]
    const ref = `${originalPosition.source}${jsonRefs.pathToPtr(parsedPath, true)}`
    const location = `${originalPosition.source}:${originalPosition.line}:${(originalPosition.column as number) + 1}`
    return { ...change, ref, location }
  } else {
    return {}
  }
}

/**
 * @class
 * Open API Diff class.
 */
export class OpenApiDiff {
  /**
   * Constructs OpenApiDiff based on provided options.
   *
   * @param {object} options The configuration options.
   *
   * @param {boolean} [options.json] A boolean flag indicating whether output format of the messages is json.
   *
   * @param {boolean} [options.matchApiVersion] A boolean flag indicating whether to consider api-version while comparing.
   */
  constructor(private options: Options) {
    log.silly(`Initializing OpenApiDiff class`)

    if (this.options === null || this.options === undefined) {
      this.options = {}
    }
    if (typeof this.options !== 'object') {
      throw new Error('options must be of type "object".')
    }

    log.debug(`Initialized OpenApiDiff class with options = ${util.inspect(this.options, { depth: null })}`)
  }

  /**
   * Compares old and new specifications.
   *
   * @param {string} oldSwagger Path to the old specification file.
   *
   * @param {string} newSwagger Path to the new specification file.
   *
   * @param {string} oldTag Tag name used for AutoRest with the old specification file.
   *
   * @param {string} newTag Tag name used for AutoRest with the new specification file.
   *
   */
  async compare(oldSwagger: string, newSwagger: string, oldTag?: string, newTag?: string) {
    log.silly(`compare is being called`)

    var promise1 = this.processViaAutoRest(oldSwagger, 'old', oldTag)
    var promise2 = this.processViaAutoRest(newSwagger, 'new', newTag)

    const results = await Promise.all([promise1, promise2])
    return this.processViaOpenApiDiff(results[0], results[1])
  }

  /**
   * Gets path to the dotnet executable.
   *
   * @returns {string} Path to the dotnet executable.
   */
  dotNetPath(): string {
    log.silly(`dotNetPath is being called`)

    // Assume that dotnet is in the PATH
    return "dotnet"
  }

  /**
   * Gets path to the autorest application.
   *
   * @returns {string} Path to the autorest app.js file.
   */
  autoRestPath(): string {
    log.silly(`autoRestPath is being called`)

    // When oad is installed globally
    {
      const result = path.join(__dirname, "..", "..", "node_modules", "autorest", "app.js")
      if (fs.existsSync(result)) {
        return `node ${result}`
      }
    }

    // When oad is installed locally
    {
      const result = path.join(__dirname, "..", "..", "..", "autorest", "app.js")
      if (fs.existsSync(result)) {
        return `node ${result}`
      }
    }

    // Assume that autorest is in the path
    return 'autorest'
  }

  /**
   * Gets path to the OpenApiDiff.dll.
   *
   * @returns {string} Path to the OpenApiDiff.dll.
   */
  openApiDiffDllPath(): string {
    log.silly(`openApiDiffDllPath is being called`)

    return path.join(__dirname, "..", "..", "..", "dlls", "OpenApiDiff.dll")
  }

  /**
   * Processes the provided specification via autorest.
   *
   * @param {string} swaggerPath Path to the specification file.
   *
   * @param {string} outputFileName Name of the output file to which autorest outputs swagger-doc.
   *
   * @param {string} tagName Name of the tag in the specification file.
   *
   */
  async processViaAutoRest(swaggerPath: string, outputFileName: string, tagName?: string): Promise<ProcessedFile> {
    log.silly(`processViaAutoRest is being called`)

    if (swaggerPath === null || swaggerPath === undefined || typeof swaggerPath.valueOf() !== 'string' || !swaggerPath.trim().length) {
        throw new Error('swaggerPath is a required parameter of type "string" and it cannot be an empty string.')
    }

    if (outputFileName === null || outputFileName === undefined || typeof outputFileName.valueOf() !== 'string' || !outputFileName.trim().length) {
        throw new Error('outputFile is a required parameter of type "string" and it cannot be an empty string.')
    }

    log.debug(`swaggerPath = "${swaggerPath}"`)
    log.debug(`outputFileName = "${outputFileName}"`)

    if (!fs.existsSync(swaggerPath)) {
      throw new Error(`File "${swaggerPath}" not found.`)
    }

    const outputFolder = os.tmpdir()
    const outputFilePath = path.join(outputFolder, `${outputFileName}.json`)
    const outputMapFilePath = path.join(outputFolder, `${outputFileName}.map`)
    const autoRestCmd = tagName
      ? `${this.autoRestPath()} ${swaggerPath} --tag=${tagName} --output-artifact=swagger-document.json --output-artifact=swagger-document.map --output-file=${outputFileName} --output-folder=${outputFolder}`
      : `${this.autoRestPath()} --input-file=${swaggerPath} --output-artifact=swagger-document.json --output-artifact=swagger-document.map --output-file=${outputFileName} --output-folder=${outputFolder}`

    log.debug(`Executing: "${autoRestCmd}"`)

    const { stderr } = await exec(autoRestCmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 })
    if (stderr) {
      throw new Error(stderr)
    }

    const buffer = await asyncFs.readFile(outputMapFilePath)
    const map = await new sourceMap.SourceMapConsumer(buffer.toString())

    log.debug(`outputFilePath: "${outputFilePath}"`)
    return {
      fileName: outputFilePath,
      map,
    }
  }

  /**
   * Processes the provided specifications via OpenApiDiff tool.
   *
   * @param {string} oldSwagger Path to the old specification file.
   *
   * @param {string} newSwagger Path to the new specification file.
   *
   */
  async processViaOpenApiDiff(oldSwaggerFile: ProcessedFile, newSwaggerFile: ProcessedFile) {
    log.silly(`processViaOpenApiDiff is being called`)

    const oldSwagger = oldSwaggerFile.fileName
    const newSwagger = newSwaggerFile.fileName
    if (oldSwagger === null || oldSwagger === undefined || typeof oldSwagger.valueOf() !== 'string' || !oldSwagger.trim().length) {
        throw new Error('oldSwagger is a required parameter of type "string" and it cannot be an empty string.')
    }

    if (newSwagger === null || newSwagger === undefined || typeof newSwagger.valueOf() !== 'string' || !newSwagger.trim().length) {
        throw new Error('newSwagger is a required parameter of type "string" and it cannot be an empty string.')
    }

    log.debug(`oldSwagger = "${oldSwagger}"`)
    log.debug(`newSwagger = "${newSwagger}"`)

    if (!fs.existsSync(oldSwagger)) {
      throw new Error(`File "${oldSwagger}" not found.`)
    }

    if (!fs.existsSync(newSwagger)) {
      throw new Error(`File "${newSwagger}" not found.`)
    }

    const cmd = `${this.dotNetPath()} ${this.openApiDiffDllPath()} -o ${oldSwagger} -n ${newSwagger}`

    log.debug(`Executing: "${cmd}"`)
    const { stdout } = await exec(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 })
    const resultJson = jsonParser.parse("", stdout) as Messages

    const updatedJson = resultJson.map(message => ({
      ...message,
      new: updateChangeProperties(message.new, newSwaggerFile),
      old: updateChangeProperties(message.old, oldSwaggerFile),
    }))
    return JSON.stringify(updatedJson)
  }
}
