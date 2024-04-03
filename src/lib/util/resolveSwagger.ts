import * as json from "@ts-common/json"
import * as jsonParser from "@ts-common/json-parser"
import * as jsonPointer from "json-pointer"

import { toArray } from "@ts-common/iterator"
import { cloneDeep, Data, FilePosition, getFilePosition, getInfo, getPath, ObjectInfo } from "@ts-common/source-map"
import * as sourceMap from "source-map"
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

/**
 * Get next array index for source object,
 * the source object is actually an array but treats as an object, so the its key must be number
 * @param source
 */
function getNextKey(source: sm.MutableStringMap<Data>) {
  const result = sm.keys(source).reduce((a, b) => (a > b ? a : b))
  if (result == undefined) {
    return "0"
  }
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
  public map: sourceMap.BasicSourceMapConsumer | sourceMap.IndexedSourceMapConsumer

  constructor(file: string, map: sourceMap.BasicSourceMapConsumer | sourceMap.IndexedSourceMapConsumer) {
    this.file = path.resolve(file)
    this.map = map
  }
  public resolve(): json.Json | undefined {
    const content: string = readFileSync(this.file, { encoding: "utf8" })
    this.parse(this.file, content)
    this.unifyXMsPaths()
    this.ConvertPathLevelParameter()
    this.ExpandDefinitions()
    this.ConvertAdditionalProperty()
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
        for (const [key, o] of sm.entries(v as any)) {
          // key != parameters indicates an http method
          if (key.toLowerCase() !== "parameters") {
            const operationParam = (o as any).parameters ? (o as any).parameters : []
            paths[property][key].parameters = mergeParameters(pathsLevelParameters, operationParam)
          }
        }
        delete (v as any).parameters
      }
    }
  }

  public ConvertAdditionalProperty() {
    if (!this.innerSwagger) {
      throw new Error("Null swagger object")
    }
    const swagger = this.innerSwagger as any
    const paths = swagger.paths
    if (paths && paths instanceof Object && toArray(sm.keys(paths)).length > 0) {
      for (const v of sm.values(paths)) {
        for (const [key, o] of sm.entries(v as any)) {
          if (key.toLowerCase() !== "parameters") {
            const operationParam = (o as any).parameters ? (o as any).parameters : []
            operationParam.forEach((v: any) => v.schema && this.transformAdditionalProperty(v.schema))
            const responses = (o as any).responses ? sm.values((o as any).responses) : []
            responses.forEach((v: any) => v.schema && this.transformAdditionalProperty(v.schema))
          } else {
            sm.values(o as any).forEach((v: any) => v.schema && this.transformAdditionalProperty(v.schema))
          }
        }
      }
    }
    if (swagger.definitions) {
      for (const o of sm.values(swagger.definitions)) {
        this.transformAdditionalProperty(o)
      }
    }
    if (swagger.parameters) {
      for (const o of sm.values(swagger.parameters)) {
        if ((o as any).schema) {
          this.transformAdditionalProperty((o as any).schema)
        }
      }
    }
  }

  private transformAdditionalProperty(schema: any) {
    if (typeof schema?.additionalProperties === "boolean") {
      if (!schema?.additionalProperties) {
        delete schema.additionalProperties
      } else {
        schema.additionalProperties = {}
      }
    }
    if (schema.properties) {
      for (const v of sm.values(schema.properties)) {
        this.transformAdditionalProperty(v)
      }
    }

    if (schema.allOf) {
      for (const v of sm.values(schema.allOf)) {
        this.transformAdditionalProperty(v)
      }
    }
  }

  private ExpandDefinitions() {
    if (!this.innerSwagger) {
      throw new Error("Null swagger object")
    }
    const swagger = this.innerSwagger as any
    const definitions = swagger.definitions
    if (definitions && toArray(sm.keys(definitions)).length > 0) {
      for (const [property, v] of sm.entries(definitions)) {
        const references = (v as any).allOf
        if (!references) {
          continue
        }
        this.ExpandAllOf(v)
        definitions[property] = v
      }
    }
  }

  /**
   * @description expands allOf
   * @param schema
   */
  private ExpandAllOf(schema: any) {
    if (!schema || !schema.allOf) {
      return
    }
    this.checkCircularAllOf(schema, undefined, [])
    const schemaList = schema.properties ? schema.properties : {}
    for (const reference of sm.values(schema.allOf)) {
      let allOfSchema = reference as any
      if (allOfSchema.$ref) {
        allOfSchema = this.dereference(allOfSchema.$ref)
        if (!allOfSchema) {
          throw new Error("Invalid reference:" + allOfSchema.$ref)
        }
      }
      if (allOfSchema.allOf) {
        this.ExpandAllOf(allOfSchema)
      }
      if (allOfSchema.properties) {
        sm.keys(allOfSchema.properties).forEach(key => {
          if (sm.keys(schemaList).some(k => k === key)) {
            if (!this.isEqual(allOfSchema.properties[key], schemaList[key])) {
              const allOfProp = allOfSchema.properties[key]
              const allOfPath = getPath(getInfo(allOfProp) as ObjectInfo)
              const allOfOriginalPosition = this.map.originalPositionFor(getFilePosition(allOfProp) as FilePosition)

              const schemaListProp = schemaList[key]
              const schemaListPath = getPath(getInfo(schemaListProp) as ObjectInfo)
              const schemaListOriginalPosition = this.map.originalPositionFor(getFilePosition(schemaListProp) as FilePosition)

              throw new Error(
                `incompatible properties : ${key}\n` +
                  `  ${schemaListPath.join("/")}\n` +
                  `    at ${schemaListOriginalPosition.source}#L${schemaListOriginalPosition.line}:${schemaListOriginalPosition.column}\n` +
                  `  ${allOfPath.join("/")}\n` +
                  `    at ${allOfOriginalPosition.source}#L${allOfOriginalPosition.line}:${allOfOriginalPosition.column}`
              )
            }
          } else {
            schemaList[key] = allOfSchema.properties[key]
          }
        })
      }
      if (allOfSchema.required) {
        const requiredProperties = schema.required ? schema.required : []
        sm.values(allOfSchema.required).forEach(prop => {
          if (!sm.values(requiredProperties).some(v => v === prop)) {
            requiredProperties.push(prop)
          }
        })
        schema.required = requiredProperties
      }
    }
    schema.properties = schemaList
  }
  /**
   * @description Compare two properties to check if they are equivalent.
   * @param parentProperty the property in allOf model.
   * @param unwrappedProperty the property in current model.
   */
  private isEqual(parentProperty: any, unwrappedProperty: any): boolean {
    if (!parentProperty) {
      throw new Error("Null parent property.")
    }
    if (!unwrappedProperty) {
      throw new Error("Null unwrapped property.")
    }
    if ((!parentProperty.type || parentProperty.type === "object") && (!unwrappedProperty.type || unwrappedProperty.type === "object")) {
      let parentPropertyToCompare = parentProperty
      let unwrappedPropertyToCompare = unwrappedProperty
      if (parentProperty.$ref) {
        parentPropertyToCompare = this.dereference(parentProperty.$ref)
      }
      if (unwrappedProperty.$ref) {
        unwrappedPropertyToCompare = this.dereference(unwrappedProperty.$ref)
      }
      if (parentPropertyToCompare === unwrappedPropertyToCompare) {
        return true
      }
      return false
    }
    if (parentProperty.type === "array" && unwrappedProperty.type === "array") {
      return this.isEqual(parentProperty.items, unwrappedProperty.items)
    }
    return parentProperty.type === unwrappedProperty.type && parentProperty.format === unwrappedProperty.format
  }

  private checkCircularAllOf(schema: any, visited: any[] | undefined, referenceChain: string[]) {
    visited = visited ? visited : []
    referenceChain = referenceChain ? referenceChain : []
    if (schema) {
      if (visited.includes(schema)) {
        throw new Error("Found circular allOf reference: " + referenceChain.join("-> "))
      }
      if (!schema.allOf) {
        return
      }
      visited.push(schema)
      sm.values(schema.allOf)
        .filter(s => (s as any).$ref)
        .forEach(s => {
          const ref = (s as any).$ref
          referenceChain.push(ref)
          const referredSchema = this.dereference(ref)
          this.checkCircularAllOf(referredSchema, visited, referenceChain)
          referenceChain.pop()
        })
      visited.pop()
    }
  }

  /**
   * Get the definition name from the reference string.
   * @param ref a json reference
   */
  private getModelName(ref: string) {
    const parts = ref.split("/")
    if (parts.length === 3 && parts[1] === "definitions") {
      return parts[2]
    }
    return undefined
  }

  private dereferenceInner(ref: string, visitedRefs: Set<string>): any {
    const model = this.getModelName(ref)
    if (model) {
      if (visitedRefs.has(ref)) {
        throw new Error("Circular reference")
      }
      if (visitedRefs.size > 40) {
        throw new Error("Exceeded max(40) reference count.")
      }
      visitedRefs.add(ref)
      const definitions = (this.innerSwagger as any).definitions
      if (definitions[model]) {
        if (definitions[model].$ref) {
          return this.dereferenceInner(definitions[model].$ref, visitedRefs)
        } else {
          return definitions[model]
        }
      } else {
        throw new Error("Invalid reference:" + ref)
      }
    }
  }
  private dereference(ref: string) {
    const model = this.getModelName(ref)
    if (model) {
      const refSet = new Set<string>()
      return this.dereferenceInner(ref, refSet)
    } else {
      throw new Error("Invalid ref: " + ref)
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
    return this.file.split("/").slice(0, -1).join("/")
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
