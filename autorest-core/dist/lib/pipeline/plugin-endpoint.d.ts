/// <reference types="node" />
import { EventEmitter } from "../events";
import { ChildProcess } from "child_process";
import { CancellationToken } from "../ref/cancellation";
import { DataHandle, DataSink, DataSource } from '../data-store/data-store';
import { Message } from "../message";
import { Readable, Writable } from "stream";
import { ConfigurationView } from "../../main";
export declare class AutoRestExtension extends EventEmitter {
    private extensionName;
    private childProcess;
    private static lastSessionId;
    private static CreateSessionId;
    private static processes;
    kill(): void;
    static killAll(): void;
    static FromModule(modulePath: string): Promise<AutoRestExtension>;
    static FromChildProcess(extensionName: string, childProc: ChildProcess): Promise<AutoRestExtension>;
    private __inspectTraffic;
    constructor(extensionName: string, reader: Readable, writer: Writable, childProcess: ChildProcess);
    private apiTarget;
    private apiInitiator;
    private apiInitiatorEndpoints;
    GetPluginNames(cancellationToken: CancellationToken): Promise<string[]>;
    Process(pluginName: string, configuration: (key: string) => any, configurationView: ConfigurationView, inputScope: DataSource, sink: DataSink, onFile: (data: DataHandle) => void, onMessage: (message: Message) => void, cancellationToken: CancellationToken): Promise<boolean>;
    private static CreateEndpointFor;
}
