import { IEvent, EventEmitter } from "./events";
import { ConfigurationView } from "./configuration";
export { ConfigurationView } from "./configuration";
import { Message } from "./message";
import { Artifact } from "./artifact";
import { DocumentType } from "./document-type";
/**
 * An instance of the AutoRest generator.
 *
 * Note: to create an instance of autore
 */
export declare class AutoRest extends EventEmitter {
    private fileSystem;
    configFileOrFolderUri?: string | undefined;
    /**
     * Event: Signals when a Process() finishes.
     */
    Finished: IEvent<AutoRest, boolean | Error>;
    /**
     * Event: Signals when a File is generated
     */
    GeneratedFile: IEvent<AutoRest, Artifact>;
    /**
     * Event: Signals when a Folder is supposed to be cleared
     */
    ClearFolder: IEvent<AutoRest, string>;
    /**
     * Event: Signals when a message is generated
     */
    Message: IEvent<AutoRest, Message>;
    private _configurations;
    private _view;
    get view(): Promise<ConfigurationView>;
    RegenerateView(includeDefault?: boolean): Promise<ConfigurationView>;
    Invalidate(): void;
    AddConfiguration(configuration: any): void;
    ResetConfiguration(): Promise<void>;
    /**
     * Called to start processing of the files.
     */
    Process(): {
        finish: Promise<boolean | Error>;
        cancel: () => void;
    };
}
/** Determines the document type based on the content of the document
 *
 * @returns Promise<DocumentType> one of:
 *  -  DocumentType.LiterateConfiguration - contains the magic string '\n> see https://aka.ms/autorest'
 *  -  DocumentType.OpenAPI2 - $.swagger === "2.0"
 *  -  DocumentType.OpenAPI3 - $.openapi === "3.0.0"
 *  -  DocumentType.Unknown - content does not match a known document type
 *
 * @see {@link DocumentType}
 */
export declare function IdentifyDocument(content: string): Promise<DocumentType>;
/**
 * Processes a document (yaml, markdown or JSON) and returns the document as a JSON-encoded document text
 * @param content - the document content
 *
 * @returns the content as a JSON string (not a JSON DOM)
 */
export declare function LiterateToJson(content: string): Promise<string>;
/**
 * Checks to see if the document is a literate configuation document.
 *
 * @param content the document content to check
 */
export declare function IsConfigurationDocument(content: string): Promise<boolean>;
/**
  *  Given a document's content, does this represent a openapi document of some sort?
  *
  * @param content - the document content to evaluate
  */
export declare function IsOpenApiDocument(content: string): Promise<boolean>;
/**
 * Shuts down any active autorest extension processes.
 */
export declare function Shutdown(): Promise<void>;
/**
 * Checks if the file extension is a known file extension for a literate configuration document.
 * @param extension the extension to check (no leading dot)
 */
export declare function IsConfigurationExtension(extension: string): Promise<boolean>;
/**
 * Checks if the file extension is a known file extension for a OpenAPI document (yaml/json/literate markdown).
 * @param extension the extension to check (no leading dot)
 */
export declare function IsOpenApiExtension(extension: string): Promise<boolean>;
