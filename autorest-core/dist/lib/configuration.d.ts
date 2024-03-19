import { Artifact } from './artifact';
import { EventEmitter, IEvent } from './events';
import { IFileSystem } from './file-system';
import { Message } from './message';
export interface AutoRestConfigurationImpl {
    __info?: string | null;
    "allow-no-input"?: boolean;
    "input-file"?: string[] | string;
    "base-folder"?: string;
    "directive"?: Directive[] | Directive;
    "declare-directive"?: {
        [name: string]: string;
    };
    "output-artifact"?: string[] | string;
    "message-format"?: "json" | "yaml" | "regular";
    "use-extension"?: {
        [extensionName: string]: string;
    };
    "require"?: string[] | string;
    "try-require"?: string[] | string;
    "help"?: any;
    "vscode"?: any;
    "override-info"?: any;
    "title"?: any;
    "description"?: any;
    "debug"?: boolean;
    "verbose"?: boolean;
    "output-file"?: string;
    "output-folder"?: string;
    "client-side-validation"?: boolean;
    "fluent"?: boolean;
    "azure-arm"?: boolean;
    "namespace"?: string;
    "license-header"?: string;
    "add-credentials"?: boolean;
    "package-name"?: string;
    "package-version"?: string;
    "sync-methods"?: "all" | "essential" | "none";
    "payload-flattening-threshold"?: number;
    "openapi-type"?: string;
}
export declare function MergeConfigurations(...configs: AutoRestConfigurationImpl[]): AutoRestConfigurationImpl;
export interface Directive {
    from?: string[] | string;
    where?: string[] | string;
    reason?: string;
    suppress?: string[] | string;
    set?: string[] | string;
    transform?: string[] | string;
    test?: string[] | string;
}
export declare class DirectiveView {
    private directive;
    constructor(directive: Directive);
    get from(): Iterable<string>;
    get where(): Iterable<string>;
    get reason(): string | null;
    get suppress(): Iterable<string>;
    get transform(): Iterable<string>;
    get test(): Iterable<string>;
}
export declare class MessageEmitter extends EventEmitter {
    /**
    * Event: Signals when a File is generated
    */
    GeneratedFile: IEvent<MessageEmitter, Artifact>;
    /**
     * Event: Signals when a Folder is supposed to be cleared
     */
    ClearFolder: IEvent<MessageEmitter, string>;
    /**
     * Event: Signals when a message is generated
     */
    Message: IEvent<MessageEmitter, Message>;
    private cancellationTokenSource;
    constructor();
}
export declare class ConfigurationView {
    [name: string]: any;
    private suppressor;
    get Keys(): Array<string>;
    Dump(title?: string): void;
    private config;
    private rawConfig;
    private ResolveAsFolder;
    private ResolveAsPath;
    private get BaseFolderUri();
    get UseExtensions(): Array<{
        name: string;
        source: string;
        fullyQualified: string;
    }>;
    IncludedConfigurationFiles(fileSystem: IFileSystem, ignoreFiles: Set<string>): Promise<string[]>;
    get Directives(): DirectiveView[];
    get InputFileUris(): string[];
    get OutputFolderUri(): string;
    IsOutputArtifactRequested(artifact: string): boolean;
    GetEntry(key: keyof AutoRestConfigurationImpl): any;
    get Raw(): AutoRestConfigurationImpl;
    get DebugMode(): boolean;
    get VerboseMode(): boolean;
    get HelpRequested(): boolean;
    GetNestedConfiguration(pluginName: string): Iterable<ConfigurationView>;
    GetNestedConfigurationImmediate(...scope: any[]): ConfigurationView;
    Message(m: Message): void;
}
export declare class Configuration {
    private fileSystem;
    private configFileOrFolderUri?;
    constructor(fileSystem?: IFileSystem, configFileOrFolderUri?: string | undefined);
    private ParseCodeBlocks;
    private static extensionManager;
    private DesugarRawConfig;
    private DesugarRawConfigs;
    static shutdown(): Promise<void>;
    CreateView(messageEmitter: MessageEmitter, includeDefault: boolean, ...configs: Array<any>): Promise<ConfigurationView>;
    static DetectConfigurationFile(fileSystem: IFileSystem, configFileOrFolderUri: string | null, messageEmitter?: MessageEmitter, walkUpFolders?: boolean): Promise<string | null>;
    static DetectConfigurationFiles(fileSystem: IFileSystem, configFileOrFolderUri: string | null, messageEmitter?: MessageEmitter, walkUpFolders?: boolean): Promise<Array<string>>;
}
