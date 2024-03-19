import { DataHandle, DataSink } from "../data-store/data-store";
import { ConfigurationView } from "../autorest-core";
export declare class CodeBlock {
    info: string | null;
    data: DataHandle;
}
export declare function Parse(config: ConfigurationView, literate: DataHandle, sink: DataSink): Promise<DataHandle>;
export declare function ParseCodeBlocks(config: ConfigurationView, literate: DataHandle, sink: DataSink): Promise<Array<CodeBlock>>;
export declare function EvaluateGuard(rawFenceGuard: string, contextObject: any): boolean;
