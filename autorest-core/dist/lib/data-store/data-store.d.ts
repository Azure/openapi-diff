import { CancellationToken } from "../ref/cancellation";
import { Mappings, SmartPosition } from "../ref/source-map";
import { YAMLNode } from "../ref/yaml";
import { RawSourceMap } from "source-map";
import { BlameTree } from "../source-map/blaming";
import { Lazy } from "../lazy";
import { IFileSystem } from "../file-system";
/********************************************
 * Data model section (not exposed)
 ********************************************/
export interface Metadata {
    artifact: string;
    inputSourceMap: Lazy<RawSourceMap>;
    sourceMap: Lazy<RawSourceMap>;
    sourceMapEachMappingByLine: Lazy<sourceMap.MappingItem[][]>;
    yamlAst: Lazy<YAMLNode>;
    lineIndices: Lazy<number[]>;
}
export interface Data {
    data: string;
    metadata: Metadata;
}
/********************************************
 * Central data controller
 * - one stop for creating data
 * - ensures WRITE ONCE model
 ********************************************/
export declare abstract class DataSource {
    abstract Enum(): Promise<string[]>;
    abstract Read(uri: string): Promise<DataHandle | null>;
    ReadStrict(uri: string): Promise<DataHandle>;
    Dump(targetDirUri: string): Promise<void>;
}
export declare class QuickDataSource extends DataSource {
    private handles;
    constructor(handles: DataHandle[]);
    Enum(): Promise<string[]>;
    Read(key: string): Promise<DataHandle | null>;
}
export declare class DataStore {
    private cancellationToken;
    static readonly BaseUri = "mem://";
    readonly BaseUri = "mem://";
    private store;
    constructor(cancellationToken?: CancellationToken);
    private ThrowIfCancelled;
    GetReadThroughScope(fs: IFileSystem): DataSource;
    /****************
     * Data access
     ***************/
    private uid;
    private WriteDataInternal;
    WriteData(description: string, data: string, artifact: string, sourceMapFactory?: (self: DataHandle) => RawSourceMap): Promise<DataHandle>;
    private createUri;
    getDataSink(defaultArtifact?: string): DataSink;
    ReadStrictSync(absoluteUri: string): DataHandle;
    Read(uri: string): Promise<DataHandle>;
    Blame(absoluteUri: string, position: SmartPosition): BlameTree;
    private CreateInputSourceMapFor;
}
/********************************************
 * Data handles
 * - provide well-defined access to specific data
 * - provide convenience methods
 ********************************************/
export declare class DataSink {
    private write;
    private forward;
    constructor(write: (description: string, rawData: string, artifact: string | undefined, metadataFactory: (readHandle: DataHandle) => RawSourceMap) => Promise<DataHandle>, forward: (description: string, input: DataHandle) => Promise<DataHandle>);
    WriteDataWithSourceMap(description: string, data: string, artifact: string | undefined, sourceMapFactory: (readHandle: DataHandle) => RawSourceMap): Promise<DataHandle>;
    WriteData(description: string, data: string, artifact?: string, mappings?: Mappings, mappingSources?: DataHandle[]): Promise<DataHandle>;
    WriteObject<T>(description: string, obj: T, artifact?: string, mappings?: Mappings, mappingSources?: DataHandle[]): Promise<DataHandle>;
    Forward(description: string, input: DataHandle): Promise<DataHandle>;
}
export declare class DataHandle {
    readonly key: string;
    private read;
    constructor(key: string, read: Data);
    ReadData(): string;
    ReadMetadata(): Metadata;
    ReadObject<T>(): T;
    ReadYamlAst(): YAMLNode;
    GetArtifact(): string;
    get Description(): string;
    IsObject(): boolean;
    Blame(position: sourceMap.Position): sourceMap.MappedPosition[];
}
