import { JsonPath } from "../ref/jsonpath";
import { DataStore } from "../data-store/data-store";
export declare class BlameTree {
    readonly node: sourceMap.MappedPosition & {
        path?: JsonPath;
    };
    readonly blaming: BlameTree[];
    static Create(dataStore: DataStore, position: sourceMap.MappedPosition): BlameTree;
    private constructor();
    BlameLeafs(): sourceMap.MappedPosition[];
}
