import { DataHandle, DataSink } from "../data-store/data-store";
import { JsonPath } from "../ref/jsonpath";
import { SmartPosition } from "../ref/source-map";
export declare function ManipulateObject(src: DataHandle, target: DataSink, whereJsonQuery: string, transformer: (doc: any, obj: any, path: JsonPath) => any, // transforming to `undefined` results in removal
mappingInfo?: {
    transformerSourceHandle: DataHandle;
    transformerSourcePosition: SmartPosition;
    reason: string;
}): Promise<{
    anyHit: boolean;
    result: DataHandle;
}>;
