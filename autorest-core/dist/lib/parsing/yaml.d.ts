import { EnhancedPosition } from "../ref/source-map";
import { YAMLNode } from '../ref/yaml';
import { JsonPath } from "../ref/jsonpath";
import { DataHandle } from "../data-store/data-store";
export declare function ResolveRelativeNode(yamlAstRoot: YAMLNode, yamlAstCurrent: YAMLNode, jsonPath: JsonPath): YAMLNode;
export declare function ReplaceNode(yamlAstRoot: YAMLNode, target: YAMLNode, value: YAMLNode | undefined): YAMLNode | undefined;
/**
 * Resolves the text position of a JSON path in raw YAML.
 */
export declare function ResolvePath(yamlFile: DataHandle, jsonPath: JsonPath): EnhancedPosition;
export declare function CreateEnhancedPosition(yamlFile: DataHandle, jsonPath: JsonPath, node: YAMLNode): EnhancedPosition;
/**
 * REPRESENTATION
 */
/**
 * rewrites anchors to $id/$$ref
 */
export declare function ConvertYaml2Jsonx(ast: YAMLNode): YAMLNode;
/**
 * rewrites $id/$ref/$$ref to anchors
 */
export declare function ConvertJsonx2Yaml(ast: YAMLNode): YAMLNode;
