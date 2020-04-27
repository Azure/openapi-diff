import * as jsonParser from "@ts-common/json-parser"
import * as jsonPointer from "json-pointer"
import * as json from "@ts-common/json"

import { readFileSync, writeFileSync } from 'fs'
import { cloneDeep, Data,FilePosition,getFilePosition} from "@ts-common/source-map"
import * as sm from "@ts-common/string-map"
import  { toArray } from "@ts-common/iterator"
import { pathToJsonPointer } from './utils'


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

export class ResolveSwagger {
    innerSwagger:json.Json | undefined
    file:string

    constructor(file:string) {
        this.file = file.replace('\\','/')
    }
    resolve() :json.Json | undefined{
        let content:string = readFileSync(this.file,{encoding:"utf8"});
        this.parse(this.file ,content)
        this.unifyXMsPaths()
        this.generateNew()
        return this.innerSwagger
    }

    unifyXMsPaths(){
        if (!this.innerSwagger)
        {
            throw new Error("non swagger object")
        }
        let swagger = this.innerSwagger as any
        const xmsPaths = swagger ["x-ms-paths"]
        const paths = swagger.paths
        if (xmsPaths && xmsPaths instanceof Object && toArray(sm.keys(xmsPaths)).length > 0) {
          for (const [property, v] of sm.entries(xmsPaths)) {
            paths[property] = v
          }
          swagger.paths = mergeObjects(xmsPaths, paths)
          delete swagger["x-ms-paths"]
        }
    }

    stringify(): string {
       return json.stringify(this.innerSwagger as json.JsonObject)
    }

    generateNew() {
        writeFileSync(this.getResolvedPath(),this.stringify())
    }

    parse(url:string,data:string){
      try {
        let json =  jsonParser.parse(url,data)
        this.innerSwagger = json
      }
      catch(e) {
        console.log(JSON.stringify(e))
      }
      
    }

    getSwaggerFolder():string{
        return this.file.split('/').slice(0,-1).join('/')
    }

    getResolvedPath():string {
        return this.file.replace('.json','-resolved.json')
    }

    getLocation(jsonPath:string):FilePosition|undefined {
        if (this.innerSwagger) {
            try {
              const pointer = pathToJsonPointer(jsonPath)
              let value = jsonPointer.get(this.innerSwagger as Object,pointer)
              return getFilePosition(value)
            }
            catch(e) {
                console.log(JSON.stringify(e))
            }
        }
    }
}
