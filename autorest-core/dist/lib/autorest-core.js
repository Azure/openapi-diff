"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsOpenApiExtension = exports.IsConfigurationExtension = exports.Shutdown = exports.IsOpenApiDocument = exports.IsConfigurationDocument = exports.LiterateToJson = exports.IdentifyDocument = exports.AutoRest = void 0;
const pipeline_1 = require("./pipeline/pipeline");
const linq_1 = require("./ref/linq");
const events_1 = require("./events");
const file_system_1 = require("./file-system");
const exception_1 = require("./exception");
const configuration_1 = require("./configuration");
var configuration_2 = require("./configuration");
Object.defineProperty(exports, "ConfigurationView", { enumerable: true, get: function () { return configuration_2.ConfigurationView; } });
const message_1 = require("./message");
const Constants = require("./constants");
const os_1 = require("os");
const document_type_1 = require("./document-type");
/**
 * An instance of the AutoRest generator.
 *
 * Note: to create an instance of autore
 */
class AutoRest extends events_1.EventEmitter {
    /**
     * @internal
     * @param fileSystem The implementation of the filesystem to load and save files from the host application.
     * @param configFileOrFolderUri The URI of the configuration file or folder containing the configuration file. Is null if no configuration file should be looked for.
     */
    constructor(fileSystem = new file_system_1.RealFileSystem(), configFileOrFolderUri) {
        super();
        this.fileSystem = fileSystem;
        this.configFileOrFolderUri = configFileOrFolderUri;
        this._configurations = new Array();
        // ensure the environment variable for the home folder is set.
        process.env["autorest.home"] = process.env["autorest.home"] || os_1.homedir();
    }
    get view() {
        return this._view ? Promise.resolve(this._view) : this.RegenerateView(true);
    }
    async RegenerateView(includeDefault = false) {
        this.Invalidate();
        const messageEmitter = new configuration_1.MessageEmitter();
        // subscribe to the events for the current configuration view
        messageEmitter.GeneratedFile.Subscribe((cfg, file) => this.GeneratedFile.Dispatch(file));
        messageEmitter.ClearFolder.Subscribe((cfg, folder) => this.ClearFolder.Dispatch(folder));
        messageEmitter.Message.Subscribe((cfg, message) => this.Message.Dispatch(message));
        return this._view = await new configuration_1.Configuration(this.fileSystem, this.configFileOrFolderUri).CreateView(messageEmitter, includeDefault, ...this._configurations);
    }
    Invalidate() {
        if (this._view) {
            this._view.messageEmitter.removeAllListeners();
            this._view = undefined;
        }
    }
    AddConfiguration(configuration) {
        linq_1.Push(this._configurations, configuration);
        this.Invalidate();
    }
    async ResetConfiguration() {
        // clear the configuratiion array.
        this._configurations.length = 0;
        this.Invalidate();
    }
    /**
     * Called to start processing of the files.
     */
    Process() {
        let earlyCancel = false;
        let cancel = () => earlyCancel = true;
        const processInternal = async () => {
            let view = null;
            try {
                // grab the current configuration view.
                view = await this.view;
                // you can't use this again!
                this._view = undefined;
                // expose cancellation token
                cancel = () => {
                    if (view) {
                        view.CancellationTokenSource.cancel();
                        view.messageEmitter.removeAllListeners();
                    }
                };
                if (view.InputFileUris.length === 0) {
                    if (view.GetEntry("allow-no-input")) {
                        this.Finished.Dispatch(true);
                        return true;
                    }
                    else {
                        // if this is using perform-load we don't need to require files.
                        // if it's using batch, we might not have files in the main body 
                        if (view.Raw["perform-load"] !== false) {
                            return new exception_1.Exception("No input files provided.\n\nUse --help to get help information.");
                        }
                    }
                }
                if (earlyCancel) {
                    this.Finished.Dispatch(false);
                    return false;
                }
                await Promise.race([
                    pipeline_1.RunPipeline(view, this.fileSystem),
                    new Promise((_, rej) => view.CancellationToken.onCancellationRequested(() => rej("Cancellation requested.")))
                ]);
                // finished -- return status (if cancelled, returns false.)
                this.Finished.Dispatch(!view.CancellationTokenSource.token.isCancellationRequested);
                view.messageEmitter.removeAllListeners();
                return true;
            }
            catch (e) {
                const message = { Channel: message_1.Channel.Information, Text: `Process() cancelled due to exception : ${e.message ? e.message : e}` };
                if (e instanceof exception_1.Exception) {
                    // idea: don't throw exceptions, just visibly log them and return false
                    message.Channel = message_1.Channel.Fatal;
                    e = false;
                }
                this.Message.Dispatch(message);
                this.Finished.Dispatch(e);
                if (view) {
                    view.messageEmitter.removeAllListeners();
                }
                return e;
            }
        };
        return {
            cancel: () => cancel(),
            finish: processInternal()
        };
    }
}
__decorate([
    events_1.EventEmitter.Event
], AutoRest.prototype, "Finished", void 0);
__decorate([
    events_1.EventEmitter.Event
], AutoRest.prototype, "GeneratedFile", void 0);
__decorate([
    events_1.EventEmitter.Event
], AutoRest.prototype, "ClearFolder", void 0);
__decorate([
    events_1.EventEmitter.Event
], AutoRest.prototype, "Message", void 0);
exports.AutoRest = AutoRest;
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
async function IdentifyDocument(content) {
    if (content) {
        // check for configuration 
        if (await IsConfigurationDocument(content)) {
            return document_type_1.DocumentType.LiterateConfiguration;
        }
        // check for openapi document
        let doc;
        try {
            // quick check to see if it's json already
            doc = JSON.parse(content);
        }
        catch (e) {
            try {
                // maybe it's yaml or literate openapip
                doc = JSON.parse(await LiterateToJson(content));
            }
            catch (e) {
                // nope
            }
        }
        if (doc) {
            return (doc.swagger && doc.swagger === "2.0") ? document_type_1.DocumentType.OpenAPI2 :
                (doc.openapi && doc.openapi === "3.0.0") ? document_type_1.DocumentType.OpenAPI3 :
                    document_type_1.DocumentType.Unknown;
        }
    }
    return document_type_1.DocumentType.Unknown;
}
exports.IdentifyDocument = IdentifyDocument;
/**
 * Processes a document (yaml, markdown or JSON) and returns the document as a JSON-encoded document text
 * @param content - the document content
 *
 * @returns the content as a JSON string (not a JSON DOM)
 */
async function LiterateToJson(content) {
    try {
        let autorest = new AutoRest({
            EnumerateFileUris: async function (folderUri) { return []; },
            ReadFile: async (f) => f == "none:///empty-file.md" ? content || "# empty file" : "# empty file"
        });
        let result = "";
        autorest.AddConfiguration({ "input-file": "none:///empty-file.md", "output-artifact": ["swagger-document"] });
        autorest.GeneratedFile.Subscribe((source, artifact) => {
            result = artifact.content;
        });
        // run autorest and wait.
        await (await autorest.Process()).finish;
        return result;
    }
    catch (x) {
        return "";
    }
}
exports.LiterateToJson = LiterateToJson;
/**
 * Checks to see if the document is a literate configuation document.
 *
 * @param content the document content to check
 */
async function IsConfigurationDocument(content) {
    // this checks to see if the document is an autorest markdown configuration document
    return content.indexOf(Constants.MagicString) > -1;
}
exports.IsConfigurationDocument = IsConfigurationDocument;
/**
  *  Given a document's content, does this represent a openapi document of some sort?
  *
  * @param content - the document content to evaluate
  */
async function IsOpenApiDocument(content) {
    switch (await IdentifyDocument(content)) {
        case document_type_1.DocumentType.OpenAPI2:
        case document_type_1.DocumentType.OpenAPI3:
            return true;
    }
    return false;
}
exports.IsOpenApiDocument = IsOpenApiDocument;
/**
 * Shuts down any active autorest extension processes.
 */
async function Shutdown() {
    await configuration_1.Configuration.shutdown();
}
exports.Shutdown = Shutdown;
/**
 * Checks if the file extension is a known file extension for a literate configuration document.
 * @param extension the extension to check (no leading dot)
 */
async function IsConfigurationExtension(extension) {
    switch (extension) {
        case "markdown":
        case "md":
            return true;
        default:
            return false;
    }
}
exports.IsConfigurationExtension = IsConfigurationExtension;
/**
 * Checks if the file extension is a known file extension for a OpenAPI document (yaml/json/literate markdown).
 * @param extension the extension to check (no leading dot)
 */
async function IsOpenApiExtension(extension) {
    switch (extension) {
        case "yaml":
        case "yml":
        case "markdown":
        case "md":
        case "json":
            return true;
        default:
            return false;
    }
}
exports.IsOpenApiExtension = IsOpenApiExtension;
//# sourceMappingURL=autorest-core.js.map