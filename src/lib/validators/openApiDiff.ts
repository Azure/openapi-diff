// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as asyncFs from "@ts-common/fs"
import * as jsonParser from "@ts-common/json-parser"
import { getFilePosition } from "@ts-common/source-map"
import * as child_process from "child_process"
import * as fs from "fs"
import JSON_Pointer from "json-pointer"
import * as jsonRefs from "json-refs"
import * as os from "os"
import * as path from "path"
import * as sourceMap from "source-map"
import * as util from "util"
import { log } from "../util/logging"
import { ResolveSwagger } from "../util/resolveSwagger"
import { pathToJsonPointer } from "../util/utils"
const _ = require("lodash")

const exec = util.promisify(child_process.exec)

export type Options = {
  readonly consoleLogLevel?: unknown
  readonly logFilepath?: unknown
}

export type ProcessedFile = {
  readonly fileName: string
  readonly map: sourceMap.BasicSourceMapConsumer | sourceMap.IndexedSourceMapConsumer
  readonly resolvedFileName: string
  readonly resolvedJson: any
}

export type ChangeProperties = {
  readonly location?: string
  readonly path?: string
  readonly ref?: string
}

export type Message = {
  readonly id: string
  readonly code: string
  readonly docUrl: string
  readonly message: string
  readonly mode: string
  readonly type: string
  readonly new: ChangeProperties
  readonly old: ChangeProperties
}

export type Messages = ReadonlyArray<Message>

const updateChangeProperties = (change: ChangeProperties, pf: ProcessedFile): ChangeProperties => {
  if (change.location) {
    let position
    let jsonPointer
    if (change.path != undefined) {
      try {
        jsonPointer = pathToJsonPointer(change.path)
        const jsonValue = JSON_Pointer.get(pf.resolvedJson, jsonPointer)
        position = getFilePosition(jsonValue)
      } catch (e) {
        console.log(e)
      }
    }

    if (!position || !Object.keys(position).length) {
      return { ...change, ref: "", location: "" }
    }
    const originalPosition = pf.map.originalPositionFor(position)
    if (!originalPosition || !Object.keys(originalPosition).length) {
      return { ...change, ref: "", location: "" }
    }
    const name = originalPosition.name as string
    const namePath = name ? name.split("\n")[0] : ""
    const parsedPath = namePath ? (JSON.parse(namePath) as string[]) : ""
    const ref = parsedPath ? `${originalPosition.source}${jsonRefs.pathToPtr(parsedPath, true)}` : ""
    const location = `${originalPosition.source}:${originalPosition.line}:${(originalPosition.column as number) + 1}`
    return { ...change, ref, location }
  } else {
    return {}
  }
}

function escape(filePath: string) {
  return `"${filePath}"`
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
    if (typeof this.options !== "object") {
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
  public async compare(oldSwagger: string, newSwagger: string, oldTag?: string, newTag?: string) {
    log.silly(`compare is being called`)
    const results = []
    results[0] = await this.processViaAutoRest(oldSwagger, "old", oldTag)
    results[1] = await this.processViaAutoRest(newSwagger, "new", newTag)
    return this.processViaOpenApiDiff(results[0], results[1])
  }

  /**
   * Gets path to the dotnet executable.
   *
   * @returns {string} Path to the dotnet executable.
   */
  public dotNetPath(): string {
    log.silly(`dotNetPath is being called`)

    // Assume that dotnet is in the PATH
    return "dotnet"
  }

  /**
   * Gets path to the autorest application.
   *
   * @returns {string} Path to the autorest app.js file.
   */
  public autoRestPath(): string {
    log.silly(`autoRestPath is being called`)

    // When oad is installed globally
    {
      const result = path.join(__dirname, "..", "..", "..", "node_modules", "autorest", "dist", "app.js")
      if (fs.existsSync(result)) {
        log.silly(`Found autoRest:${result} `)
        return `node ${escape(result)}`
      }
    }

    // When oad is installed locally
    {
      const result = path.join(__dirname, "..", "..", "..", "..", "..", "autorest", "dist", "app.js")
      if (fs.existsSync(result)) {
        log.silly(`Found autoRest:${result} `)
        return `node ${escape(result)}`
      }
    }

    // Try to find autorest in `node-modules`
    {
      const result = path.resolve("node_modules/.bin/autorest")
      if (fs.existsSync(result)) {
        log.silly(`Found autoRest:${result} `)
        return escape(result)
      }
    }

    // Assume that autorest is in the path
    return "autorest"
  }

  /**
   * Gets path to the OpenApiDiff.dll.
   *
   * @returns {string} Path to the OpenApiDiff.dll.
   */
  public openApiDiffDllPath(): string {
    log.silly(`openApiDiffDllPath is being called`)

    return escape(path.join(__dirname, "..", "..", "..", "dlls", "OpenApiDiff.dll"))
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
  public async processViaAutoRest(swaggerPath: string, outputFileName: string, tagName?: string): Promise<ProcessedFile> {
    log.silly(`processViaAutoRest is being called`)

    if (swaggerPath === null || swaggerPath === undefined || typeof swaggerPath.valueOf() !== "string" || !swaggerPath.trim().length) {
      throw new Error('swaggerPath is a required parameter of type "string" and it cannot be an empty string.')
    }

    if (
      outputFileName === null ||
      outputFileName === undefined ||
      typeof outputFileName.valueOf() !== "string" ||
      !outputFileName.trim().length
    ) {
      throw new Error('outputFile is a required parameter of type "string" and it cannot be an empty string.')
    }

    log.debug(`swaggerPath = "${swaggerPath}"`)
    log.debug(`outputFileName = "${outputFileName}"`)

    if (!fs.existsSync(swaggerPath)) {
      throw new Error(`File "${swaggerPath}" not found.`)
    }

    const outputFolder = await fs.promises.mkdtemp(path.join(os.tmpdir(), "oad-"))
    const outputFilePath = path.join(outputFolder, `${outputFileName}.json`)
    const outputMapFilePath = path.join(outputFolder, `${outputFileName}.map`)
    const autoRestCmd = tagName
      ? `${this.autoRestPath()} ${swaggerPath} --v2 --tag=${tagName} --output-artifact=swagger-document.json` +
        ` --output-artifact=swagger-document.map --output-file=${outputFileName} --output-folder=${outputFolder}`
      : `${this.autoRestPath()} --v2 --input-file=${swaggerPath} --output-artifact=swagger-document.json` +
        ` --output-artifact=swagger-document.map --output-file=${outputFileName} --output-folder=${outputFolder}`

    log.debug(`Executing: "${autoRestCmd}"`)

    const { stderr } = await exec(autoRestCmd, {
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 64,
      env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=8192" }
    })
    if (stderr) {
      throw new Error(stderr)
    }
    const resolveSwagger = new ResolveSwagger(outputFilePath)
    const resolvedJson = resolveSwagger.resolve()
    const resolvedPath: string = resolveSwagger.getResolvedPath()
    if (!resolvedJson) {
      throw new Error("resolve failed!")
    }

    const buffer = await asyncFs.readFile(outputMapFilePath)
    const map = await new sourceMap.SourceMapConsumer(buffer.toString())

    log.debug(`outputFilePath: "${outputFilePath}"`)
    return {
      fileName: outputFilePath,
      map,
      resolvedFileName: resolvedPath,
      resolvedJson
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
  public async processViaOpenApiDiff(oldSwaggerFile: ProcessedFile, newSwaggerFile: ProcessedFile) {
    log.silly(`processViaOpenApiDiff is being called`)

    const oldSwagger = oldSwaggerFile.resolvedFileName
    const newSwagger = newSwaggerFile.resolvedFileName
    if (oldSwagger === null || oldSwagger === undefined || typeof oldSwagger.valueOf() !== "string" || !oldSwagger.trim().length) {
      throw new Error('oldSwagger is a required parameter of type "string" and it cannot be an empty string.')
    }

    if (newSwagger === null || newSwagger === undefined || typeof newSwagger.valueOf() !== "string" || !newSwagger.trim().length) {
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
    const { stdout } = await exec(cmd, { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 })
    const resultJson = JSON.parse(stdout) as Messages

    const updatedJson = resultJson.map(message => ({
      ...message,
      new: updateChangeProperties(message.new, newSwaggerFile),
      old: updateChangeProperties(message.old, oldSwaggerFile)
    }))
    const uniqueJson = _.uniqWith(updatedJson, _.isEqual)
    return JSON.stringify(uniqueJson)
  }
}
