export { Position } from "source-map";
import { Position } from "source-map";
export { RawSourceMap } from "source-map";
import { JsonPath } from "../ref/jsonpath";
export interface PositionEnhancements {
    path?: JsonPath;
    length?: number;
    valueOffset?: number;
    valueLength?: number;
}
export declare type EnhancedPosition = Position & PositionEnhancements;
export declare type SmartPosition = Position | {
    path: JsonPath;
};
export interface Mapping {
    generated: SmartPosition;
    original: SmartPosition;
    source: string;
    name?: string;
}
export declare type Mappings = Array<Mapping>;
