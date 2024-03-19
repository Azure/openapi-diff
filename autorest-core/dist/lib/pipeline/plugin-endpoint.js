"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoRestExtension = void 0;
const lazy_1 = require("../lazy");
const events_1 = require("../events");
const child_process_1 = require("child_process");
const cancellation_1 = require("../ref/cancellation");
const jsonrpc_1 = require("../ref/jsonrpc");
const plugin_api_1 = require("./plugin-api");
const exception_1 = require("../exception");
const message_1 = require("../message");
const stream_1 = require("stream");
const uri_1 = require("../ref/uri");
class AutoRestExtension extends events_1.EventEmitter {
    constructor(extensionName, reader, writer, childProcess) {
        super();
        this.extensionName = extensionName;
        this.childProcess = childProcess;
        // Exposed through __status and consumed by tools like autorest-interactive.
        this.__inspectTraffic = [];
        this.apiInitiatorEndpoints = {};
        // hook in inspectors
        reader.on("data", chunk => {
            try {
                this.__inspectTraffic.push([Date.now(), false, chunk.toString()]);
            }
            catch (e) { }
        });
        const writerProxy = new stream_1.Writable({
            write: (chunk, encoding, callback) => {
                try {
                    this.__inspectTraffic.push([Date.now(), true, chunk.toString()]);
                }
                catch (e) { }
                return writer.write(chunk, encoding, callback);
            }
        });
        // create channel
        const channel = jsonrpc_1.createMessageConnection(reader, writerProxy, console);
        channel.listen();
        // initiator
        const dispatcher = (fnName) => async (sessionId, ...rest) => {
            try {
                const endpoint = this.apiInitiatorEndpoints[sessionId];
                if (endpoint) {
                    return await endpoint[fnName](...rest);
                }
            }
            catch (e) {
                if (e != "Cancellation requested.") {
                    // Suppress this from hitting the console. 
                    // todo: we should see if we can put it out as an event.
                    // console.error(`Error occurred in handler for '${fnName}' in session '${sessionId}':`);
                    // console.error(e);
                }
            }
        };
        this.apiInitiator = {
            ReadFile: dispatcher("ReadFile"),
            GetValue: dispatcher("GetValue"),
            ListInputs: dispatcher("ListInputs"),
            WriteFile: dispatcher("WriteFile"),
            Message: dispatcher("Message"),
        };
        channel.onRequest(plugin_api_1.IAutoRestPluginInitiator_Types.ReadFile, this.apiInitiator.ReadFile);
        channel.onRequest(plugin_api_1.IAutoRestPluginInitiator_Types.GetValue, this.apiInitiator.GetValue);
        channel.onRequest(plugin_api_1.IAutoRestPluginInitiator_Types.ListInputs, this.apiInitiator.ListInputs);
        channel.onNotification(plugin_api_1.IAutoRestPluginInitiator_Types.WriteFile, this.apiInitiator.WriteFile);
        channel.onNotification(plugin_api_1.IAutoRestPluginInitiator_Types.Message, this.apiInitiator.Message);
        const errorPromise = new Promise((_, rej) => channel.onError(e => { rej(new exception_1.Exception(`AutoRest extension '${extensionName}' reported error: ` + e)); }));
        const terminationPromise = new Promise((_, rej) => channel.onClose(() => { rej(new exception_1.Exception(`AutoRest extension '${extensionName}' terminated.`)); }));
        // target
        this.apiTarget = {
            async GetPluginNames(cancellationToken) {
                return await Promise.race([errorPromise, terminationPromise, channel.sendRequest(plugin_api_1.IAutoRestPluginTarget_Types.GetPluginNames, cancellationToken)]);
            },
            async Process(pluginName, sessionId, cancellationToken) {
                return await Promise.race([errorPromise, terminationPromise, channel.sendRequest(plugin_api_1.IAutoRestPluginTarget_Types.Process, pluginName, sessionId, cancellationToken)]);
            }
        };
    }
    static CreateSessionId() { return `session_${++AutoRestExtension.lastSessionId}`; }
    kill() {
        if (!this.childProcess.killed) {
            this.childProcess.once("error", (e) => { });
            this.childProcess.kill();
        }
    }
    static killAll() {
        for (const each of AutoRestExtension.processes) {
            if (!each.killed) {
                each.once("error", (e) => { });
                each.kill("SIGKILL");
            }
        }
        AutoRestExtension.processes.length = 0;
    }
    static async FromModule(modulePath) {
        const childProc = child_process_1.fork(modulePath, [], { silent: true });
        return AutoRestExtension.FromChildProcess(modulePath, childProc);
    }
    static async FromChildProcess(extensionName, childProc) {
        const plugin = new AutoRestExtension(extensionName, childProc.stdout, childProc.stdin, childProc);
        childProc.stderr.pipe(process.stderr);
        AutoRestExtension.processes.push(childProc);
        // poke the extension to detect trivial issues like process startup failure or protocol violations, ...
        if (!Array.isArray(await plugin.GetPluginNames(cancellation_1.CancellationToken.None))) {
            throw new exception_1.Exception(`Plugin '${extensionName}' violated the protocol ('GetPluginNames' returned unexpected object).`);
        }
        return plugin;
    }
    GetPluginNames(cancellationToken) {
        return this.apiTarget.GetPluginNames(cancellationToken);
    }
    async Process(pluginName, configuration, configurationView, inputScope, sink, onFile, onMessage, cancellationToken) {
        const sid = AutoRestExtension.CreateSessionId();
        // register endpoint
        this.apiInitiatorEndpoints[sid] = AutoRestExtension.CreateEndpointFor(pluginName, configuration, configurationView, inputScope, sink, onFile, onMessage, cancellationToken);
        // dispatch
        const result = await this.apiTarget.Process(pluginName, sid, cancellationToken);
        // wait for outstanding notifications
        await this.apiInitiatorEndpoints[sid].FinishNotifications();
        // unregister endpoint
        delete this.apiInitiatorEndpoints[sid];
        return result;
    }
    static CreateEndpointFor(pluginName, configuration, configurationView, inputScope, sink, onFile, onMessage, cancellationToken) {
        const inputFileHandles = new lazy_1.LazyPromise(async () => {
            const names = await inputScope.Enum();
            return await Promise.all(names.map(fn => inputScope.ReadStrict(fn)));
        });
        // name transformation
        // decodeUriComponent horsehockey is there because we may have an over-decoded URI from the plugin.
        const friendly2internal = async (name) => ((await inputFileHandles).filter(h => h.Description === name || decodeURIComponent(h.Description) === decodeURIComponent(name))[0] || {}).key;
        const internal2friendly = async (key) => (await inputScope.Read(key) || {}).Description;
        const writeFileToSinkAndNotify = async (filename, content, artifactType, sourceMap) => {
            if (!sourceMap) {
                sourceMap = [];
            }
            // TODO: transform mappings so friendly names are replaced by internals
            let handle;
            if (typeof sourceMap.mappings === "string") {
                onFile(handle = await sink.WriteDataWithSourceMap(filename, content, artifactType, () => sourceMap));
            }
            else {
                onFile(handle = await sink.WriteData(filename, content, artifactType, sourceMap, await inputFileHandles));
            }
            return {
                uri: handle.key,
                type: handle.GetArtifact(),
                content: handle.ReadData()
            };
        };
        let finishNotifications = Promise.resolve();
        const apiInitiator = {
            FinishNotifications() { return finishNotifications; },
            async ReadFile(filename) {
                try {
                    const file = await inputScope.ReadStrict(await friendly2internal(filename) || filename);
                    return file.ReadData();
                }
                catch (E) {
                    // try getting the file from the output-folder
                    try {
                        const result = await configurationView.fileSystem.ReadFile(`${configurationView.OutputFolderUri}${filename}`);
                        return result;
                    }
                    catch (E2) {
                        // no file there!
                        throw E;
                    }
                }
            },
            async GetValue(key) {
                try {
                    const result = configuration(key);
                    return result === undefined ? null : result;
                }
                catch (e) {
                    return null;
                }
            },
            async ListInputs(artifactType) {
                if (artifactType && typeof artifactType !== "string") {
                    artifactType = undefined;
                }
                const inputs = (await inputFileHandles)
                    .filter(x => {
                    return typeof artifactType !== "string" || artifactType === x.GetArtifact();
                })
                    .map(x => x.Description);
                // if the request returned items, or they didn't specify a path/artifacttype
                if (inputs.length > 0 || artifactType === null || artifactType === undefined) {
                    return inputs;
                }
                // we'd like to be able to ask the host for a file directly (but only if it's supposed to be in the output-folder)
                const t = configurationView.OutputFolderUri.length;
                return (await configurationView.fileSystem.EnumerateFileUris(uri_1.EnsureIsFolderUri(`${configurationView.OutputFolderUri}${artifactType || ""}`))).map(each => each.substr(t));
            },
            async WriteFile(filename, content, sourceMap) {
                if (!sourceMap) {
                    sourceMap = [];
                }
                const finishPrev = finishNotifications;
                let notify = () => { };
                finishNotifications = new Promise(res => notify = res);
                const artifact = await writeFileToSinkAndNotify(filename, content, undefined, sourceMap);
                onMessage({ Channel: message_1.Channel.File, Details: artifact, Text: artifact.content, Plugin: pluginName, Key: [artifact.type, artifact.uri] });
                await finishPrev;
                notify();
            },
            async Message(message) {
                const finishPrev = finishNotifications;
                let notify = () => { };
                finishNotifications = new Promise(res => notify = res);
                message.Plugin = message.Plugin || pluginName;
                // transform friendly with internals
                if (Array.isArray(message.Source)) {
                    for (const source of message.Source) {
                        if (source.document) {
                            source.document = await friendly2internal(source.document) || source.document;
                        }
                    }
                }
                if (message.Channel === message_1.Channel.Configuration) {
                    // special case. route the output to the config 
                    if (message.Key && message.Text) {
                        const key = [...message.Key];
                        if (key.length > 0) {
                            configurationView.updateConfigurationFile(key[0], message.Text);
                        }
                    }
                    await finishPrev;
                    notify();
                }
                if (message.Channel === message_1.Channel.File) {
                    // wire through `sink` in order to retrieve default artifact type
                    const artifactMessage = message;
                    const artifact = artifactMessage.Details;
                    await writeFileToSinkAndNotify(artifact.uri, artifact.content, artifact.type, artifact.sourceMap);
                }
                onMessage(message);
                await finishPrev;
                notify();
            }
        };
        return apiInitiator;
    }
}
exports.AutoRestExtension = AutoRestExtension;
AutoRestExtension.lastSessionId = 0;
AutoRestExtension.processes = new Array();
//# sourceMappingURL=plugin-endpoint.js.map