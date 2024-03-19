import { RequestType0, RequestType2 } from "../ref/jsonrpc";
import { NotificationType4 } from "../ref/jsonrpc";
import { Mapping, RawSourceMap, SmartPosition } from "../ref/source-map";
import { Message } from "../message";
export declare module IAutoRestPluginTarget_Types {
    const GetPluginNames: RequestType0<string[], Error, void>;
    const Process: RequestType2<string, string, boolean, Error, void>;
}
export interface IAutoRestPluginTarget {
    GetPluginNames(): Promise<string[]>;
    Process(pluginName: string, sessionId: string): Promise<boolean>;
}
export declare module IAutoRestPluginInitiator_Types {
    const ReadFile: RequestType2<string, string, string, Error, void>;
    const GetValue: RequestType2<string, string, any, Error, void>;
    const ListInputs: RequestType2<string, string | undefined, string[], Error, void>;
    const WriteFile: NotificationType4<string, string, string, RawSourceMap | Mapping[] | undefined, void>;
}
export interface IAutoRestPluginInitiator {
    ReadFile(sessionId: string, filename: string): Promise<string>;
    GetValue(sessionId: string, key: string): Promise<any>;
    ListInputs(sessionId: string, artifactType?: string): Promise<string[]>;
    WriteFile(sessionId: string, filename: string, content: string, sourceMap?: Mapping[] | RawSourceMap): void;
    Message(sessionId: string, message: Message, path?: SmartPosition, sourceFile?: string): void;
}
