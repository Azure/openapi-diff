import * as json from "@ts-common/json"
import * as jsonParser from "@ts-common/json-parser"
import * as jsonPointer from "json-pointer"

import { toArray } from "@ts-common/iterator"
import { cloneDeep, Data, FilePosition, getFilePosition } from "@ts-common/source-map"
import * as sm from "@ts-common/string-map"
import { readFileSync, writeFileSync } from "fs"
import * as path from "path"
import { pathToJsonPointer } from "./utils"

/*
 * Merges source object into the target object
 * @param {object} source The object that needs to be merged
 *
 * @param {object} target The object to be merged into
 *
 * @returns {object} target - Returns the merged target object.
 */
export function mergeObjects<T extends sm.MutableStringMap<Data>>(source: T, target: T): T {
  const result: sm.MutableStringMap<Data> = target
  for (const [key, sourceProperty] of sm.entries(source)) {
    if (Array.isArray(sourceProperty)) {
      const targetProperty = target[key]
      if (!targetProperty) {
        result[key] = sourceProperty
      } else if (!Array.isArray(targetProperty)) {
        throw new Error(
          `Cannot merge ${key} from source object into target object because the same property ` +
            `in target object is not (of the same type) an Array.`
        )
      } else {
        result[key] = mergeArrays(sourceProperty, targetProperty)
      }
    } else {
      result[key] = cloneDeep(sourceProperty)
    }
  }
  return result as T
}

/*
 * Merges source array into the target array
 * @param {array} source The array that needs to be merged
 *
 * @param {array} target The array to be merged into
 *
 * @returns {array} target - Returns the merged target array.
 */
export function mergeArrays<T extends Data>(source: ReadonlyArray<T>, target: T[]): T[] {
  if (!Array.isArray(target) || !Array.isArray(source)) {
    return target
  }
  source.forEach(item => {
    target.push(cloneDeep(item))
  })
  return target
}

function getParamKey(source: any) {
  return source.$ref ? source.$ref : source.in + source.name
}

function getNextKey(source: sm.MutableStringMap<Data>) {
  const result = sm.keys(source).reduce((a, b) => (a > b ? a : b))
  return (+(result as string) + 1).toString()
}

function mergeParameters<T extends sm.MutableStringMap<Data>>(source: T, target: T): T {
  const result: sm.MutableStringMap<Data> = target
  for (const sourceProperty of sm.values(source)) {
    if (!sm.values(target).some(v => getParamKey(v) === getParamKey(sourceProperty))) {
      result[getNextKey(result)] = sourceProperty
    }
  }
  return result as T
}

/**
 * This class aimed at process some swagger extensions like x-ms-path and
 * you can also resolve some swagger keyword e.g allOf here, then return a
 * new json with source location info
 */
export class ResolveSwagger {
  public innerSwagger: json.Json | undefined
  public file: string

  constructor(file: string) {
    this.file = path.resolve(file)
  }
  public resolve(): json.Json | undefined {
    const content: string = readFileSync(this.file, { encoding: "utf8" })
    this.parse(this.file, content)
    this.unifyXMsPaths()
    this.ConvertPathLevelParameter()
    this.generateNew()
    return this.innerSwagger
  }

  private unifyXMsPaths() {
    if (!this.innerSwagger) {
      throw new Error("non swagger object")
    }
    const swagger = this.innerSwagger as any
    const xmsPaths = swagger["x-ms-paths"]
    const paths = swagger.paths
    if (xmsPaths && xmsPaths instanceof Object && toArray(sm.keys(xmsPaths)).length > 0) {
      for (const [property, v] of sm.entries(xmsPaths)) {
        paths[property] = v
      }
      swagger.paths = mergeObjects(xmsPaths, paths)
      delete swagger["x-ms-paths"]
    }
  }

  private ConvertPathLevelParameter() {
    if (!this.innerSwagger) {
      throw new Error("Null swagger object")
    }
    const swagger = this.innerSwagger as any
    const paths = swagger.paths
    if (paths && paths instanceof Object && toArray(sm.keys(paths)).length > 0) {
      for (const [property, v] of sm.entries(paths)) {
        const pathsLevelParameters = (v as any).parameters
        if (!pathsLevelParameters) {
          continue
        }
        for (const [httpMethod, o] of sm.entries(v as any)) {
          if (httpMethod.toLowerCase() !== "parameters") {
            const operationParam = (o as any).parameters ? (o as any).parameters : []
            paths[property][httpMethod].parameters = mergeParameters(pathsLevelParameters, operationParam)
          }
        }
        delete (v as any).parameters
      }
    }
  }

  private stringify(): string {
    return json.stringify(this.innerSwagger as json.JsonObject)
  }

  private generateNew() {
    writeFileSync(this.getResolvedPath(), this.stringify())
  }

  private parse(url: string, data: string) {
    try {
      this.innerSwagger = jsonParser.parse(url, data)
    } catch (e) {
      console.log(JSON.stringify(e))
    }
  }

  public getSwaggerFolder(): string {
    return this.file
      .split("/")
      .slice(0, -1)
      .join("/")
  }

  public getResolvedPath(): string {
    return this.file.replace(".json", "-resolved.json")
  }

  public getLocation(jsonPath: string): FilePosition | undefined {
    if (this.innerSwagger) {
      try {
        const pointer = pathToJsonPointer(jsonPath)
        const value = jsonPointer.get(this.innerSwagger as object, pointer)
        return getFilePosition(value)
      } catch (e) {
        console.log(JSON.stringify(e))
      }
    }
  }
}
