import { EnhancedPosition, Mappings, SmartPosition } from "../ref/source-map";
import { JsonPath } from "../ref/jsonpath";
import { DataHandle } from "../data-store/data-store";
export declare function TryDecodeEnhancedPositionFromName(name: string | undefined): EnhancedPosition | undefined;
export declare function EncodeEnhancedPositionInName(name: string | undefined, pos: EnhancedPosition): string;
export declare function CompilePosition(position: SmartPosition, yamlFile: DataHandle): EnhancedPosition;
export declare function Compile(mappings: Mappings, target: sourceMap.SourceMapGenerator, yamlFiles?: DataHandle[]): void;
export declare function CreateAssignmentMapping(assignedObject: any, sourceKey: string, sourcePath: JsonPath, targetPath: JsonPath, subject: string): Mappings;
