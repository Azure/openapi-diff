import * as jsonpath from "jsonpath";
export declare type JsonPathComponent = jsonpath.PathComponent;
export declare type JsonPath = JsonPathComponent[];
export declare function parse(jsonPath: string): JsonPath;
export declare function stringify(jsonPath: JsonPath): string;
export declare function paths<T>(obj: T, jsonQuery: string): JsonPath[];
export declare function nodes<T>(obj: T, jsonQuery: string): {
    path: JsonPath;
    value: any;
}[];
export declare function IsPrefix(prefix: JsonPath, path: JsonPath): boolean;
export declare function CreateObject(jsonPath: JsonPath, leafObject: any): any;
export declare function matches(jsonQuery: string, jsonPath: JsonPath): boolean;
export declare function parseJsonPointer(jsonPointer: string): JsonPath;
