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
exports.Configuration = exports.ConfigurationView = exports.GetExtension = exports.MessageEmitter = exports.DirectiveView = exports.MergeConfigurations = void 0;
const yaml_1 = require("./ref/yaml");
const extension_1 = require("@microsoft.azure/extension");
const path_1 = require("path");
const Constants = require("./constants");
const data_store_1 = require("./data-store/data-store");
const events_1 = require("./events");
const exception_1 = require("./exception");
const file_system_1 = require("./file-system");
const lazy_1 = require("./lazy");
const message_1 = require("./message");
const literate_yaml_1 = require("./parsing/literate-yaml");
const plugin_endpoint_1 = require("./pipeline/plugin-endpoint");
const suppression_1 = require("./pipeline/suppression");
const async_1 = require("./ref/async");
const cancellation_1 = require("./ref/cancellation");
const jsonpath_1 = require("./ref/jsonpath");
const linq_1 = require("./ref/linq");
const uri_1 = require("./ref/uri");
const merging_1 = require("./source-map/merging");
const source_map_1 = require("./source-map/source-map");
const safe_eval_1 = require("./ref/safe-eval");
const untildify = require("untildify");
const RESOLVE_MACROS_AT_RUNTIME = true;
function MergeConfigurations(...configs) {
    let result = {};
    for (const config of configs) {
        result = MergeConfiguration(result, config);
    }
    return result;
}
exports.MergeConfigurations = MergeConfigurations;
// TODO: operate on DataHandleRead and create source map!
function MergeConfiguration(higherPriority, lowerPriority) {
    // check guard
    if (lowerPriority.__info && !literate_yaml_1.EvaluateGuard(lowerPriority.__info, higherPriority)) {
        // guard false? => skip
        return higherPriority;
    }
    // merge
    return merging_1.MergeOverwriteOrAppend(higherPriority, lowerPriority);
}
function ValuesOf(value) {
    if (value === undefined) {
        return [];
    }
    if (value instanceof Array) {
        return value;
    }
    return [value];
}
class DirectiveView {
    constructor(directive) {
        this.directive = directive;
    }
    get from() {
        return ValuesOf(this.directive["from"]);
    }
    get where() {
        return ValuesOf(this.directive["where"]);
    }
    get reason() {
        return this.directive.reason || null;
    }
    get suppress() {
        return ValuesOf(this.directive["suppress"]);
    }
    get transform() {
        return ValuesOf(this.directive["transform"]);
    }
    get test() {
        return ValuesOf(this.directive["test"]);
    }
}
exports.DirectiveView = DirectiveView;
class MessageEmitter extends events_1.EventEmitter {
    constructor() {
        super();
        this.cancellationTokenSource = new cancellation_1.CancellationTokenSource();
        this.DataStore = new data_store_1.DataStore(this.CancellationToken);
    }
    /* @internal */ get messageEmitter() { return this; }
    /* @internal */ get CancellationTokenSource() { return this.cancellationTokenSource; }
    /* @internal */ get CancellationToken() { return this.cancellationTokenSource.token; }
}
__decorate([
    events_1.EventEmitter.Event
], MessageEmitter.prototype, "GeneratedFile", void 0);
__decorate([
    events_1.EventEmitter.Event
], MessageEmitter.prototype, "ClearFolder", void 0);
__decorate([
    events_1.EventEmitter.Event
], MessageEmitter.prototype, "Message", void 0);
exports.MessageEmitter = MessageEmitter;
function ProxifyConfigurationView(cfgView) {
    return new Proxy(cfgView, {
        get: (target, property) => {
            const value = target[property];
            if (value && value instanceof Array) {
                const result = [];
                for (const each of value) {
                    result.push(merging_1.resolveRValue(each, "", target, null));
                }
                return result;
            }
            return merging_1.resolveRValue(value, property, null, cfgView);
        }
    });
}
const loadedExtensions = {};
/*@internal*/ async function GetExtension(fullyQualified) {
    return await loadedExtensions[fullyQualified].autorestExtension;
}
exports.GetExtension = GetExtension;
class ConfigurationView {
    /* @internal */ constructor(
    /* @internal */ configurationFiles, 
    /* @internal */ fileSystem, 
    /* @internal */ messageEmitter, 
    /* @internal */ configFileFolderUri, ...configs // decreasing priority
    ) {
        this.configurationFiles = configurationFiles;
        this.fileSystem = fileSystem;
        this.messageEmitter = messageEmitter;
        this.configFileFolderUri = configFileFolderUri;
        // TODO: fix configuration loading, note that there was no point in passing that DataStore used
        // for loading in here as all connection to the sources is lost when passing `Array<AutoRestConfigurationImpl>` instead of `DataHandleRead`s...
        // theoretically the `ValuesOf` approach and such won't support blaming (who to blame if $.directives[3] sucks? which code block was it from)
        // long term, we simply gotta write a `Merge` method that adheres to the rules we need in here.
        this.rawConfig = {
            "directive": [],
            "input-file": [],
            "output-artifact": [],
            "require": [],
            "try-require": [],
            "use": [],
        };
        this.rawConfig = MergeConfigurations(this.rawConfig, ...configs);
        // default values that are the least priority.
        // TODO: why is this here and not in default-configuration?
        this.rawConfig = MergeConfiguration(this.rawConfig, {
            "base-folder": ".",
            "output-folder": "generated",
            "debug": false,
            "verbose": false,
            "disable-validation": false
        });
        if (RESOLVE_MACROS_AT_RUNTIME) {
            // if RESOLVE_MACROS_AT_RUNTIME is set
            // this will insert a Proxy object in most of the uses of
            // the configuration, and will do a macro resolution when the
            // value is retrieved.
            // I have turned on this behavior by default. I'm not sure that
            // I need it at this point, but I'm leaving this code here since
            // It's possible that I do.
            this.config = ProxifyConfigurationView(this.rawConfig);
        }
        else {
            this.config = this.rawConfig;
        }
        this.suppressor = new suppression_1.Suppressor(this);
        // this.Message({ Channel: Channel.Debug, Text: `Creating ConfigurationView : ${configs.length} sections.` });
        // treat this as a configuration property too.
        (this.rawConfig).configurationFiles = configurationFiles;
    }
    get Keys() {
        return Object.getOwnPropertyNames(this.config);
    }
    /* @internal */ updateConfigurationFile(filename, content) {
        // only name itself is allowed here, no path
        filename = path_1.basename(filename);
        const keys = Object.getOwnPropertyNames(this.configurationFiles);
        if (keys && keys.length > 0) {
            const path = path_1.dirname(keys[0]);
            if (path.startsWith("file://")) {
                // the configuration is a file path
                // we can save the configuration file to the target location
                this.GeneratedFile.Dispatch({ content, type: "configuration", uri: `${path}/${filename}` });
            }
        }
    }
    Dump(title = "") {
        console.log(`\n${title}\n===================================`);
        for (const each of Object.getOwnPropertyNames(this.config)) {
            console.log(`${each} : ${this.config[each]}`);
        }
        ;
    }
    /* @internal */ get Indexer() {
        return new Proxy(this, {
            get: (target, property) => {
                return property in target.config ? target.config[property] : this[property];
            }
        });
    }
    /* @internal */ get DataStore() { return this.messageEmitter.DataStore; }
    /* @internal */ get CancellationToken() { return this.messageEmitter.CancellationToken; }
    /* @internal */ get CancellationTokenSource() { return this.messageEmitter.CancellationTokenSource; }
    /* @internal */ get GeneratedFile() { return this.messageEmitter.GeneratedFile; }
    /* @internal */ get ClearFolder() { return this.messageEmitter.ClearFolder; }
    ResolveAsFolder(path) {
        return uri_1.EnsureIsFolderUri(uri_1.ResolveUri(this.BaseFolderUri, path));
    }
    ResolveAsPath(path) {
        return uri_1.ResolveUri(this.BaseFolderUri, path);
    }
    get BaseFolderUri() {
        return uri_1.EnsureIsFolderUri(uri_1.ResolveUri(this.configFileFolderUri, this.config["base-folder"]));
    }
    // public methods
    get UseExtensions() {
        const useExtensions = this.Indexer["use-extension"] || {};
        return Object.keys(useExtensions).map(name => {
            const source = useExtensions[name];
            return {
                name: name,
                source: source,
                fullyQualified: JSON.stringify([name, source])
            };
        });
    }
    async IncludedConfigurationFiles(fileSystem, ignoreFiles) {
        const result = new Array();
        for (const each of linq_1.From(ValuesOf(this.config["require"]))) {
            const path = this.ResolveAsPath(each);
            if (!ignoreFiles.has(path)) {
                result.push(this.ResolveAsPath(each));
            }
        }
        // for try require, see if it exists before including it in the list.
        for (const each of linq_1.From(ValuesOf(this.config["try-require"]))) {
            const path = this.ResolveAsPath(each);
            try {
                if (!ignoreFiles.has(path) && await fileSystem.ReadFile(path)) {
                    result.push(path);
                    continue;
                }
            }
            catch (_a) {
                // skip it.
            }
            ignoreFiles.add(path);
        }
        // return the aggregate list of things we're supposed to include
        return result;
    }
    get Directives() {
        const plainDirectives = ValuesOf(this.config["directive"]);
        const declarations = this.config["declare-directive"] || {};
        const expandDirective = (dir) => {
            const makro = Object.keys(dir).filter(makro => declarations[makro])[0];
            if (!makro) {
                return [dir]; // nothing to expand
            }
            // prepare directive
            let parameters = dir[makro];
            if (!Array.isArray(parameters)) {
                parameters = [parameters];
            }
            dir = Object.assign({}, dir);
            delete dir[makro];
            // call makro
            const makroResults = linq_1.From(parameters).SelectMany(parameter => {
                // console.log(new Error().stack);
                const result = safe_eval_1.safeEval(declarations[makro], { $: parameter, $context: dir });
                return Array.isArray(result) ? result : [result];
            }).ToArray();
            return linq_1.From(makroResults).SelectMany((result) => expandDirective(Object.assign(result, dir)));
        };
        // makro expansion
        return linq_1.From(plainDirectives).SelectMany(expandDirective).Select(each => new DirectiveView(each)).ToArray();
    }
    get InputFileUris() {
        return linq_1.From(ValuesOf(this.config["input-file"]))
            .Select(each => this.ResolveAsPath(each))
            .ToArray();
    }
    get OutputFolderUri() {
        return this.ResolveAsFolder(this.config["output-folder"]);
    }
    IsOutputArtifactRequested(artifact) {
        return linq_1.From(ValuesOf(this.config["output-artifact"])).Contains(artifact);
    }
    GetEntry(key) {
        let result = this.config;
        for (const keyPart of key.split(".")) {
            result = result[keyPart];
        }
        return result;
    }
    get Raw() {
        return this.config;
    }
    get DebugMode() {
        return !!this.config["debug"];
    }
    get VerboseMode() {
        return !!this.config["verbose"];
    }
    get HelpRequested() {
        return !!this.config["help"];
    }
    *GetNestedConfiguration(pluginName) {
        for (const section of ValuesOf(this.config[pluginName])) {
            if (section) {
                yield this.GetNestedConfigurationImmediate(section === true ? {} : section);
            }
        }
    }
    GetNestedConfigurationImmediate(...scope) {
        return new ConfigurationView(this.configurationFiles, this.fileSystem, this.messageEmitter, this.configFileFolderUri, ...scope, this.config).Indexer;
    }
    // message pipeline (source map resolution, filter, ...)
    Message(m) {
        if (m.Channel === message_1.Channel.Debug && !this.DebugMode) {
            return;
        }
        if (m.Channel === message_1.Channel.Verbose && !this.VerboseMode) {
            return;
        }
        try {
            // update source locations to point to loaded Swagger
            if (m.Source && typeof (m.Source.map) === 'function') {
                const blameSources = m.Source.map(s => {
                    let blameTree = null;
                    try {
                        const originalPath = JSON.stringify(s.Position.path);
                        let shouldComplain = false;
                        while (blameTree === null) {
                            try {
                                blameTree = this.DataStore.Blame(s.document, s.Position);
                                if (shouldComplain) {
                                    this.Message({
                                        Channel: message_1.Channel.Verbose,
                                        Text: `\nDEVELOPER-WARNING: Path '${originalPath}' was corrected to ${JSON.stringify(s.Position.path)} on MESSAGE '${JSON.stringify(m.Text)}'\n`
                                    });
                                }
                            }
                            catch (e) {
                                if (!shouldComplain) {
                                    shouldComplain = true;
                                }
                                const path = s.Position.path;
                                if (path) {
                                    if (path.length === 0) {
                                        throw e;
                                    }
                                    // adjustment
                                    // 1) skip leading `$`
                                    if (path[0] === "$") {
                                        path.shift();
                                    }
                                    // 2) drop last part
                                    else {
                                        path.pop();
                                    }
                                }
                                else {
                                    throw e;
                                }
                            }
                        }
                    }
                    catch (e) {
                        this.Message({
                            Channel: message_1.Channel.Warning,
                            Text: `Failed to blame ${JSON.stringify(s.Position)} in '${JSON.stringify(s.document)}' (${e})`,
                            Details: e
                        });
                        return [s];
                    }
                    return blameTree.BlameLeafs().map(r => ({ document: r.source, Position: Object.assign(Object.assign({}, source_map_1.TryDecodeEnhancedPositionFromName(r.name)), { line: r.line, column: r.column }) }));
                });
                //console.log("---");
                //console.log(JSON.stringify(m.Source, null, 2));
                m.Source = linq_1.From(blameSources).SelectMany(x => x).ToArray();
                // get friendly names
                for (const source of m.Source) {
                    if (source.Position) {
                        try {
                            source.document = this.DataStore.ReadStrictSync(source.document).Description;
                        }
                        catch (e) {
                        }
                    }
                }
                //console.log(JSON.stringify(m.Source, null, 2));
                //console.log("---");
            }
            // set range (dummy)
            if (m.Source && typeof (m.Source.map) === 'function') {
                m.Range = m.Source.map(s => {
                    const positionStart = s.Position;
                    const positionEnd = { line: s.Position.line, column: s.Position.column + (s.Position.length || 3) };
                    return {
                        document: s.document,
                        start: positionStart,
                        end: positionEnd
                    };
                });
            }
            // filter
            const mx = this.suppressor.Filter(m);
            // forward
            if (mx !== null) {
                // format message
                switch (this.GetEntry("message-format")) {
                    case "json":
                        // TODO: WHAT THE FUDGE, check with the consumers whether this has to be like that... otherwise, consider changing the format to something less generic
                        if (mx.Details) {
                            mx.Details.sources = (mx.Source || []).filter(x => x.Position).map(source => {
                                let text = `${source.document}:${source.Position.line}:${source.Position.column}`;
                                if (source.Position.path) {
                                    text += ` (${jsonpath_1.stringify(source.Position.path)})`;
                                }
                                return text;
                            });
                            if (mx.Details.sources.length > 0) {
                                mx.Details["jsonref"] = mx.Details.sources[0];
                                mx.Details["json-path"] = mx.Details.sources[0];
                            }
                        }
                        mx.FormattedMessage = JSON.stringify(mx.Details || mx, null, 2);
                        break;
                    case "yaml":
                        mx.FormattedMessage = yaml_1.Stringify([mx.Details || mx]).replace(/^---/, "");
                        break;
                    default:
                        let text = `${(mx.Channel || message_1.Channel.Information).toString().toUpperCase()}${mx.Key ? ` (${[...mx.Key].join("/")})` : ""}: ${mx.Text}`;
                        for (const source of mx.Source || []) {
                            if (source.Position) {
                                try {
                                    text += `\n    - ${source.document}`;
                                    if (source.Position.line !== undefined) {
                                        text += `:${source.Position.line}`;
                                        if (source.Position.column !== undefined) {
                                            text += `:${source.Position.column}`;
                                        }
                                    }
                                    if (source.Position.path) {
                                        text += ` (${jsonpath_1.stringify(source.Position.path)})`;
                                    }
                                }
                                catch (e) {
                                    // no friendly name, so nothing more specific to show
                                }
                            }
                        }
                        mx.FormattedMessage = text;
                        break;
                }
                this.messageEmitter.Message.Dispatch(mx);
            }
        }
        catch (e) {
            this.messageEmitter.Message.Dispatch({ Channel: message_1.Channel.Error, Text: `${e}` });
        }
    }
}
exports.ConfigurationView = ConfigurationView;
class Configuration {
    constructor(fileSystem = new file_system_1.RealFileSystem(), configFileOrFolderUri) {
        this.fileSystem = fileSystem;
        this.configFileOrFolderUri = configFileOrFolderUri;
    }
    async ParseCodeBlocks(configFile, contextConfig, scope) {
        // load config
        const hConfig = await literate_yaml_1.ParseCodeBlocks(contextConfig, configFile, contextConfig.DataStore.getDataSink());
        if (hConfig.length === 1 && hConfig[0].info === null && configFile.Description.toLowerCase().endsWith(".md")) {
            // this is a whole file, and it's a markdown file.
            return [];
        }
        const blocks = hConfig.filter(each => each).map(each => {
            const block = each.data.ReadObject() || {};
            if (typeof block !== "object") {
                contextConfig.Message({
                    Channel: message_1.Channel.Error,
                    Text: "Syntax error: Invalid YAML object.",
                    Source: [{ document: each.data.key, Position: { line: 1, column: 0 } }]
                });
                throw new exception_1.OperationAbortedException();
            }
            block.__info = each.info;
            return block;
        });
        return blocks;
    }
    async DesugarRawConfig(configs) {
        // shallow copy
        configs = Object.assign({}, configs);
        configs["use-extension"] = Object.assign({}, configs["use-extension"]);
        if (configs.hasOwnProperty('licence-header')) {
            configs['license-header'] = configs['licence-header'];
            delete configs['licence-header'];
        }
        // use => use-extension
        let use = configs.use;
        if (typeof use === "string") {
            use = [use];
        }
        if (Array.isArray(use)) {
            const extMgr = await Configuration.extensionManager;
            for (const useEntry of use) {
                if (typeof useEntry === "string") {
                    // attempt <package>@<version> interpretation
                    const separatorIndex = useEntry.lastIndexOf('@');
                    const versionPart = useEntry.slice(separatorIndex + 1);
                    if (separatorIndex > 0 && /^[^/\\]+$/.test(versionPart)) {
                        const pkg = await extMgr.findPackage(useEntry.slice(0, separatorIndex), versionPart);
                        configs["use-extension"][pkg.name] = versionPart;
                    }
                    else {
                        const pkg = await extMgr.findPackage("foo", useEntry);
                        configs["use-extension"][pkg.name] = useEntry;
                    }
                }
            }
            delete configs.use;
        }
        return configs;
    }
    async DesugarRawConfigs(configs) {
        return Promise.all(configs.map(c => this.DesugarRawConfig(c)));
    }
    static async shutdown() {
        try {
            plugin_endpoint_1.AutoRestExtension.killAll();
            // once we shutdown those extensions, we should shutdown the EM too. 
            const extMgr = await Configuration.extensionManager;
            extMgr.dispose();
            // but if someone goes to use that, we're going to need a new instance (since the shared lock will be gone in the one we disposed.)
            Configuration.extensionManager = new lazy_1.LazyPromise(() => extension_1.ExtensionManager.Create(path_1.join(process.env["autorest.home"] || require("os").homedir(), ".autorest")));
            for (const each in loadedExtensions) {
                const ext = loadedExtensions[each];
                if (ext.autorestExtension.hasValue) {
                    const extension = await ext.autorestExtension;
                    extension.kill();
                    delete loadedExtensions[each];
                }
            }
        }
        catch (_a) { }
    }
    async CreateView(messageEmitter, includeDefault, ...configs) {
        const configFileUri = this.fileSystem && this.configFileOrFolderUri
            ? await Configuration.DetectConfigurationFile(this.fileSystem, this.configFileOrFolderUri, messageEmitter)
            : null;
        const configFileFolderUri = configFileUri ? uri_1.ResolveUri(configFileUri, "./") : (this.configFileOrFolderUri || "file:///");
        const configurationFiles = {};
        const configSegments = [];
        const createView = (segments = configSegments) => new ConfigurationView(configurationFiles, this.fileSystem, messageEmitter, configFileFolderUri, ...segments);
        const addSegments = async (configs) => { const segs = await this.DesugarRawConfigs(configs); configSegments.push(...segs); return segs; };
        // 1. overrides (CLI, ...)
        await addSegments(configs);
        // 2. file
        if (configFileUri !== null) {
            const inputView = messageEmitter.DataStore.GetReadThroughScope(this.fileSystem);
            // add loaded files to the input files.
            configurationFiles[configFileUri] = (await inputView.ReadStrict(configFileUri)).ReadData();
            const blocks = await this.ParseCodeBlocks(await inputView.ReadStrict(configFileUri), createView(), "config");
            await addSegments(blocks);
        }
        // 3. resolve 'require'd configuration
        const addedConfigs = new Set();
        const includeFn = async () => {
            while (true) {
                const tmpView = createView();
                // add loaded files to the input files.
                const additionalConfigs = (await tmpView.IncludedConfigurationFiles(this.fileSystem, addedConfigs));
                if (additionalConfigs.length === 0) {
                    break;
                }
                // acquire additional configs
                for (const additionalConfig of additionalConfigs) {
                    try {
                        messageEmitter.Message.Dispatch({
                            Channel: message_1.Channel.Verbose,
                            Text: `> Including configuration file '${additionalConfig}'`
                        });
                        addedConfigs.add(additionalConfig);
                        // merge config
                        const inputView = messageEmitter.DataStore.GetReadThroughScope(this.fileSystem);
                        configurationFiles[additionalConfig] = (await inputView.ReadStrict(additionalConfig)).ReadData();
                        const blocks = await this.ParseCodeBlocks(await inputView.ReadStrict(additionalConfig), tmpView, `require-config-${additionalConfig}`);
                        await addSegments(blocks);
                    }
                    catch (e) {
                        messageEmitter.Message.Dispatch({
                            Channel: message_1.Channel.Fatal,
                            Text: `Failed to acquire 'require'd configuration '${additionalConfig}'`
                        });
                        throw e;
                    }
                }
            }
        };
        await includeFn();
        // 4. default configuration
        if (includeDefault) {
            const inputView = messageEmitter.DataStore.GetReadThroughScope(new file_system_1.RealFileSystem());
            const blocks = await this.ParseCodeBlocks(await inputView.ReadStrict(uri_1.ResolveUri(uri_1.CreateFolderUri(__dirname), "../../resources/default-configuration.md")), createView(), "default-config");
            await addSegments(blocks);
        }
        await includeFn();
        const mf = createView().GetEntry('message-format');
        // 5. resolve extensions
        const extMgr = await Configuration.extensionManager;
        const addedExtensions = new Set();
        const viewsToHandle = [createView()];
        while (viewsToHandle.length > 0) {
            const tmpView = viewsToHandle.pop();
            const additionalExtensions = tmpView.UseExtensions.filter(ext => !addedExtensions.has(ext.fullyQualified));
            await addSegments([{ "used-extension": tmpView.UseExtensions.map(x => x.fullyQualified) }]);
            if (additionalExtensions.length === 0) {
                continue;
            }
            // acquire additional extensions
            for (const additionalExtension of additionalExtensions) {
                try {
                    addedExtensions.add(additionalExtension.fullyQualified);
                    let ext = loadedExtensions[additionalExtension.fullyQualified];
                    // not yet loaded?
                    if (!ext) {
                        let localPath = untildify(additionalExtension.source);
                        // try resolving the package locally (useful for self-contained)
                        try {
                            const fileProbe = "/package.json";
                            localPath = require.resolve(additionalExtension.name + fileProbe); // have to resolve specific file - resolving a package by name will fail if no 'main' is present
                            localPath = localPath.slice(0, localPath.length - fileProbe.length);
                        }
                        catch (e) { }
                        if (await async_1.exists(localPath)) {
                            if (mf !== 'json' && mf !== 'yaml') {
                                // local package
                                messageEmitter.Message.Dispatch({
                                    Channel: message_1.Channel.Information,
                                    Text: `> Loading local AutoRest extension '${additionalExtension.name}' (${localPath})`
                                });
                            }
                            const pack = await extMgr.findPackage(additionalExtension.name, localPath);
                            const extension = new extension_1.LocalExtension(pack, localPath);
                            // start extension
                            ext = loadedExtensions[additionalExtension.fullyQualified] = {
                                extension: extension,
                                autorestExtension: new lazy_1.LazyPromise(async () => plugin_endpoint_1.AutoRestExtension.FromChildProcess(additionalExtension.name, await extension.start()))
                            };
                        }
                        else {
                            // remote package
                            const installedExtension = await extMgr.getInstalledExtension(additionalExtension.name, additionalExtension.source);
                            if (installedExtension) {
                                if (mf !== 'json' && mf !== 'yaml') {
                                    messageEmitter.Message.Dispatch({
                                        Channel: message_1.Channel.Information,
                                        Text: `> Loading AutoRest extension '${additionalExtension.name}' (${additionalExtension.source}->${installedExtension.version})`
                                    });
                                }
                                // start extension
                                ext = loadedExtensions[additionalExtension.fullyQualified] = {
                                    extension: installedExtension,
                                    autorestExtension: new lazy_1.LazyPromise(async () => plugin_endpoint_1.AutoRestExtension.FromChildProcess(additionalExtension.name, await installedExtension.start()))
                                };
                            }
                            else {
                                // acquire extension
                                const pack = await extMgr.findPackage(additionalExtension.name, additionalExtension.source);
                                messageEmitter.Message.Dispatch({
                                    Channel: message_1.Channel.Information,
                                    Text: `> Installing AutoRest extension '${additionalExtension.name}' (${additionalExtension.source})`
                                });
                                const cwd = process.cwd(); // TODO: fix extension?
                                const extension = await extMgr.installPackage(pack, false, 5 * 60 * 1000, (progressInit) => progressInit.Message.Subscribe((s, m) => tmpView.Message({ Text: m, Channel: message_1.Channel.Verbose })));
                                process.chdir(cwd);
                                // start extension
                                ext = loadedExtensions[additionalExtension.fullyQualified] = {
                                    extension: extension,
                                    autorestExtension: new lazy_1.LazyPromise(async () => plugin_endpoint_1.AutoRestExtension.FromChildProcess(additionalExtension.name, await extension.start()))
                                };
                            }
                        }
                    }
                    await includeFn();
                    // merge config
                    const inputView = messageEmitter.DataStore.GetReadThroughScope(new file_system_1.RealFileSystem());
                    const blocks = await this.ParseCodeBlocks(await inputView.ReadStrict(uri_1.CreateFileUri(await ext.extension.configurationPath)), createView(), `extension-config-${additionalExtension.fullyQualified}`);
                    viewsToHandle.push(createView(await addSegments(blocks)));
                }
                catch (e) {
                    messageEmitter.Message.Dispatch({
                        Channel: message_1.Channel.Fatal,
                        Text: `Failed to install or start extension '${additionalExtension.name}' (${additionalExtension.source})`
                    });
                    throw e;
                }
            }
        }
        return createView().Indexer;
    }
    static async DetectConfigurationFile(fileSystem, configFileOrFolderUri, messageEmitter, walkUpFolders = false) {
        const files = await this.DetectConfigurationFiles(fileSystem, configFileOrFolderUri, messageEmitter, walkUpFolders);
        return linq_1.From(files).FirstOrDefault(each => each.toLowerCase().endsWith("/" + Constants.DefaultConfiguration)) ||
            linq_1.From(files).OrderBy(each => each.length).FirstOrDefault() || null;
    }
    static async DetectConfigurationFiles(fileSystem, configFileOrFolderUri, messageEmitter, walkUpFolders = false) {
        const originalConfigFileOrFolderUri = configFileOrFolderUri;
        // null means null!
        if (!configFileOrFolderUri) {
            return [];
        }
        // try querying the Uri directly
        let content;
        try {
            content = await fileSystem.ReadFile(configFileOrFolderUri);
        }
        catch (_a) {
            // didn't get the file successfully, move on.
            content = null;
        }
        if (content !== null) {
            if (content.indexOf(Constants.MagicString) > -1) {
                // the file name was passed in!
                return [configFileOrFolderUri];
            }
            try {
                const ast = yaml_1.ParseToAst(content);
                if (ast) {
                    return [configFileOrFolderUri];
                }
            }
            catch (_b) {
                // nope.
            }
            // this *was* an actual file passed in, not a folder. don't make this harder than it has to be.
            throw new Error(`Specified file '${originalConfigFileOrFolderUri}' is not a valid configuration file (missing magic string, see https://github.com/Azure/autorest/blob/master/docs/user/literate-file-formats/configuration.md#the-file-format).`);
        }
        // scan the filesystem items for configurations.
        const results = new Array();
        for (const name of await fileSystem.EnumerateFileUris(uri_1.EnsureIsFolderUri(configFileOrFolderUri))) {
            if (name.endsWith(".md")) {
                const content = await fileSystem.ReadFile(name);
                if (content.indexOf(Constants.MagicString) > -1) {
                    results.push(name);
                }
            }
        }
        if (walkUpFolders) {
            // walk up
            const newUriToConfigFileOrWorkingFolder = uri_1.ResolveUri(configFileOrFolderUri, "..");
            if (newUriToConfigFileOrWorkingFolder !== configFileOrFolderUri) {
                results.push(...await this.DetectConfigurationFiles(fileSystem, newUriToConfigFileOrWorkingFolder, messageEmitter, walkUpFolders));
            }
        }
        else {
            if (messageEmitter && results.length === 0) {
                messageEmitter.Message.Dispatch({
                    Channel: message_1.Channel.Verbose,
                    Text: `No configuration found at '${originalConfigFileOrFolderUri}'.`
                });
            }
        }
        return results;
    }
}
exports.Configuration = Configuration;
Configuration.extensionManager = new lazy_1.LazyPromise(() => extension_1.ExtensionManager.Create(path_1.join(process.env["autorest.home"] || require("os").homedir(), ".autorest")));
//# sourceMappingURL=configuration.js.map