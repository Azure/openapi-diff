import * as yamlAst from "yaml-ast-parser";
import { JsonPath } from "./jsonpath";
/**
 * reexport required elements
 */
export { newScalar } from "yaml-ast-parser";
export declare const Kind: {
    SCALAR: number;
    MAPPING: number;
    MAP: number;
    SEQ: number;
    ANCHOR_REF: number;
    INCLUDE_REF: number;
};
export declare type YAMLNode = yamlAst.YAMLNode;
export declare type YAMLScalar = yamlAst.YAMLScalar;
export declare type YAMLMapping = yamlAst.YAMLMapping;
export declare type YAMLMap = yamlAst.YamlMap;
export declare type YAMLSequence = yamlAst.YAMLSequence;
export declare type YAMLAnchorReference = yamlAst.YAMLAnchorReference;
export declare const CreateYAMLAnchorRef: (key: string) => YAMLMap;
export declare const CreateYAMLMap: () => YAMLMap;
export declare const CreateYAMLMapping: (key: YAMLScalar, value: YAMLNode) => YAMLMapping;
export declare const CreateYAMLScalar: (value: string) => YAMLScalar;
export interface YAMLNodeWithPath {
    path: JsonPath;
    node: YAMLNode;
}
/**
 * Parsing
*/
export declare function ParseToAst(rawYaml: string): YAMLNode;
export declare function Descendants(yamlAstNode: YAMLNode, currentPath?: JsonPath, deferResolvingMappings?: boolean): Iterable<YAMLNodeWithPath>;
export declare function ResolveAnchorRef(yamlAstRoot: YAMLNode, anchorRef: string): YAMLNodeWithPath;
export declare function ParseNode<T>(yamlNode: YAMLNode, onError?: (message: string, index: number) => void): T;
export declare function CloneAst<T extends YAMLNode>(ast: T): T;
export declare function StringifyAst(ast: YAMLNode): string;
export declare function Clone<T>(object: T): T;
/**
 * Normalizes the order of given object's keys (sorts recursively)
 */
export declare function Normalize<T>(object: T): T;
export declare function ToAst<T>(object: T): YAMLNode;
export declare function Parse<T>(rawYaml: string, onError?: (message: string, index: number) => void): T;
export declare function Stringify<T>(object: T): string;
export declare function FastStringify<T>(obj: T): string;
export declare function StrictJsonSyntaxCheck(json: string): {
    message: string;
    index: number;
} | null;
