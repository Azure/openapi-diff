/// <reference types="node" />
export declare function mkdir(path: string | Buffer): Promise<void>;
export declare const exists: (path: string | Buffer) => Promise<boolean>;
export declare function readdir(path: string): Promise<Array<string>>;
export declare function close(fd: number): Promise<void>;
export declare function readFile(path: string, options?: {
    encoding?: string | null;
    flag?: string;
}): Promise<string | Buffer>;
export declare function writeFile(filename: string, content: string): Promise<void>;
