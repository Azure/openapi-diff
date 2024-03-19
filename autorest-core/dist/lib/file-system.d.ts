export interface IFileSystem {
    EnumerateFileUris(folderUri: string): Promise<Array<string>>;
    ReadFile(uri: string): Promise<string>;
}
export declare class MemoryFileSystem implements IFileSystem {
    static readonly DefaultVirtualRootUri = "file:///";
    private filesByUri;
    constructor(files: Map<string, string>);
    readonly Outputs: Map<string, string>;
    ReadFile(uri: string): Promise<string>;
    EnumerateFileUris(folderUri?: string): Promise<Array<string>>;
    WriteFile(uri: string, content: string): Promise<void>;
}
export declare class RealFileSystem implements IFileSystem {
    constructor();
    EnumerateFileUris(folderUri: string): Promise<string[]>;
    ReadFile(uri: string): Promise<string>;
    WriteFile(uri: string, content: string): Promise<void>;
}
export declare class EnhancedFileSystem implements IFileSystem {
    private githubAuthToken?;
    constructor(githubAuthToken?: string | undefined);
    EnumerateFileUris(folderUri: string): Promise<string[]>;
    ReadFile(uri: string): Promise<string>;
    WriteFile(uri: string, content: string): Promise<void>;
}
