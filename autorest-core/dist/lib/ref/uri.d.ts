export declare function IsUri(uri: string): boolean;
/**
 * Loads a UTF8 string from given URI.
 */
export declare function ReadUri(uri: string, headers?: {
    [key: string]: string;
}): Promise<string>;
export declare function ExistsUri(uri: string): Promise<boolean>;
/**
 * Create a 'file:///' URI from given absolute path.
 * Examples:
 * - "C:\swagger\storage.yaml" -> "file:///C:/swagger/storage.yaml"
 * - "/input/swagger.yaml" -> "file:///input/swagger.yaml"
 */
export declare function CreateFileOrFolderUri(absolutePath: string): string;
export declare function CreateFileUri(absolutePath: string): string;
export declare function CreateFolderUri(absolutePath: string): string;
export declare function EnsureIsFolderUri(uri: string): string;
export declare function EnsureIsFileUri(uri: string): string;
export declare function GetFilename(uri: string): string;
export declare function GetFilenameWithoutExtension(uri: string): string;
export declare function ToRawDataUrl(uri: string): string;
/**
 * The singularity of all resolving.
 * With URI as our one data type of truth, this method maps an absolute or relative path or URI to a URI using given base URI.
 * @param baseUri   Absolute base URI
 * @param pathOrUri Relative/absolute path/URI
 * @returns Absolute URI
 */
export declare function ResolveUri(baseUri: string, pathOrUri: string): string;
export declare function ParentFolderUri(uri: string): string | null;
export declare function MakeRelativeUri(baseUri: string, absoluteUri: string): string;
export declare function EnumerateFiles(folderUri: string, probeFiles?: string[]): Promise<string[]>;
/**
 * Writes string to local file system.
 * @param fileUri  Target file uri.
 * @param data     String to write (encoding: UTF8).
 */
export declare function WriteString(fileUri: string, data: string): Promise<void>;
export declare function ClearFolder(folderUri: string): Promise<void>;
export declare function FileUriToPath(fileUri: string): string;
export declare function GetExtension(name: string): string;
