/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Stringify, ParseToAst } from './ref/yaml';
import { Extension, ExtensionManager, LocalExtension } from "@microsoft.azure/extension";
import { ChildProcess } from "child_process";

import { join, basename, dirname } from "path";
import { Artifact } from './artifact';
import * as Constants from './constants';
import { DataHandle, DataStore } from './data-store/data-store';
import { EventEmitter, IEvent } from './events';
import { OperationAbortedException } from './exception';
import { IFileSystem, RealFileSystem } from './file-system';
import { LazyPromise } from './lazy';
import { Channel, Message, Range, SourceLocation } from './message';
import { EvaluateGuard, ParseCodeBlocks } from './parsing/literate-yaml';
import { AutoRestExtension } from './pipeline/plugin-endpoint';
import { Suppressor } from './pipeline/suppression';
import { exists } from './ref/async';
import { CancellationToken, CancellationTokenSource } from './ref/cancellation';
import { stringify } from './ref/jsonpath';
import { From } from './ref/linq';
import { CreateFileUri, CreateFolderUri, EnsureIsFolderUri, ExistsUri, ResolveUri } from './ref/uri';
import { BlameTree } from './source-map/blaming';
import { MergeOverwriteOrAppend, resolveRValue } from './source-map/merging';
import { TryDecodeEnhancedPositionFromName } from './source-map/source-map';
import { safeEval } from './ref/safe-eval';
import { OutstandingTaskAwaiter } from "./outstanding-task-awaiter"

const untildify: (path: string) => string = require("untildify");

const RESOLVE_MACROS_AT_RUNTIME = true;

export interface AutoRestConfigurationImpl {
  __info?: string | null;
  "allow-no-input"?: boolean;
  "input-file"?: string[] | string;
  "base-folder"?: string;
  "directive"?: Directive[] | Directive;
  "declare-directive"?: { [name: string]: string };
  "output-artifact"?: string[] | string;
  "message-format"?: "json" | "yaml" | "regular";
  "use-extension"?: { [extensionName: string]: string };
  "require"?: string[] | string;
  "try-require"?: string[] | string;
  "help"?: any;
  "vscode"?: any; // activates VS Code specific behavior and does *NOT* influence the core's behavior (only consumed by VS Code extension)

  "override-info"?: any; // make sure source maps are pulling it! (see "composite swagger" method)
  "title"?: any;
  "description"?: any;

  "debug"?: boolean;
  "verbose"?: boolean;

  // plugin specific
  "output-file"?: string;
  "output-folder"?: string;

  // from here on: CONVENTION, not cared about by the core
  "client-side-validation"?: boolean; // C#
  "fluent"?: boolean;
  "azure-arm"?: boolean;
  "namespace"?: string;
  "license-header"?: string;
  "add-credentials"?: boolean;
  "package-name"?: string; // Ruby, Python, ...
  "package-version"?: string;
  "sync-methods"?: "all" | "essential" | "none";
  "payload-flattening-threshold"?: number;
  "openapi-type"?: string // the specification type (ARM/Data-Plane/Default)
}

export function MergeConfigurations(...configs: AutoRestConfigurationImpl[]): AutoRestConfigurationImpl {
  let result: AutoRestConfigurationImpl = {};
  for (const config of configs) {
    result = MergeConfiguration(result, config);
  }
  return result;
}

// TODO: operate on DataHandleRead and create source map!
function MergeConfiguration(higherPriority: AutoRestConfigurationImpl, lowerPriority: AutoRestConfigurationImpl): AutoRestConfigurationImpl {
  // check guard
  if (lowerPriority.__info && !EvaluateGuard(lowerPriority.__info, higherPriority)) {
    // guard false? => skip
    return higherPriority;
  }

  // merge
  return MergeOverwriteOrAppend(higherPriority, lowerPriority);
}

function ValuesOf<T>(value: any): Iterable<T> {
  if (value === undefined) {
    return [];
  }
  if (value instanceof Array) {
    return value;
  }
  return [value];
}

export interface Directive {
  from?: string[] | string;
  where?: string[] | string;
  reason?: string;

  // one of:
  suppress?: string[] | string;
  set?: string[] | string;
  transform?: string[] | string;
  test?: string[] | string;
}

export class DirectiveView {
  constructor(private directive: Directive) {
  }

  public get from(): Iterable<string> {
    return ValuesOf<string>(this.directive["from"]);
  }

  public get where(): Iterable<string> {
    return ValuesOf<string>(this.directive["where"]);
  }

  public get reason(): string | null {
    return this.directive.reason || null;
  }

  public get suppress(): Iterable<string> {
    return ValuesOf<string>(this.directive["suppress"]);
  }

  public get transform(): Iterable<string> {
    return ValuesOf<string>(this.directive["transform"]);
  }

  public get test(): Iterable<string> {
    return ValuesOf<string>(this.directive["test"]);
  }
}

export class MessageEmitter extends EventEmitter {
  /**
  * Event: Signals when a File is generated
  */
  @EventEmitter.Event public GeneratedFile!: IEvent<MessageEmitter, Artifact>;
  /**
   * Event: Signals when a Folder is supposed to be cleared
   */
  @EventEmitter.Event public ClearFolder!: IEvent<MessageEmitter, string>;
  /**
   * Event: Signals when a message is generated
   */
  @EventEmitter.Event public Message!: IEvent<MessageEmitter, Message>;
  private cancellationTokenSource = new CancellationTokenSource();

  constructor() {
    super();
    this.DataStore = new DataStore(this.CancellationToken);
  }
  /* @internal */ public DataStore: DataStore;
  /* @internal */ public get messageEmitter() { return this; }
  /* @internal */ public get CancellationTokenSource(): CancellationTokenSource { return this.cancellationTokenSource; }
  /* @internal */ public get CancellationToken(): CancellationToken { return this.cancellationTokenSource.token; }
}

function ProxifyConfigurationView(cfgView: any) {
  return new Proxy(cfgView, {
    get: (target, property) => {
      const value = (<any>target)[property];
      if (value && value instanceof Array) {
        const result = [];
        for (const each of value) {
          result.push(resolveRValue(each, "", target, null));
        }
        return result;
      }
      return resolveRValue(value, <string>property, null, cfgView);
    }
  });
}

const loadedExtensions: { [fullyQualified: string]: { extension: Extension, autorestExtension: LazyPromise<AutoRestExtension> } } = {};
/*@internal*/ export async function GetExtension(fullyQualified: string): Promise<AutoRestExtension> {
  return await loadedExtensions[fullyQualified].autorestExtension;
}

export class ConfigurationView {
  [name: string]: any;

  private suppressor: Suppressor;

  /* @internal */ constructor(
    /* @internal */public configurationFiles: { [key: string]: any; },
    /* @internal */public fileSystem: IFileSystem,
    /* @internal */public messageEmitter: MessageEmitter,
    /* @internal */public configFileFolderUri: string,
    ...configs: Array<AutoRestConfigurationImpl> // decreasing priority
  ) {
    // TODO: fix configuration loading, note that there was no point in passing that DataStore used
    // for loading in here as all connection to the sources is lost when passing `Array<AutoRestConfigurationImpl>` instead of `DataHandleRead`s...
    // theoretically the `ValuesOf` approach and such won't support blaming (who to blame if $.directives[3] sucks? which code block was it from)
    // long term, we simply gotta write a `Merge` method that adheres to the rules we need in here.
    this.rawConfig = <any>{
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
    this.rawConfig = MergeConfiguration(this.rawConfig, <any>{
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
    } else {
      this.config = this.rawConfig;
    }
    this.suppressor = new Suppressor(this);
    // this.Message({ Channel: Channel.Debug, Text: `Creating ConfigurationView : ${configs.length} sections.` });

    // treat this as a configuration property too.
    (<any>(this.rawConfig)).configurationFiles = configurationFiles;
  }

  public get Keys(): Array<string> {
    return Object.getOwnPropertyNames(this.config);
  }

  /* @internal */ public updateConfigurationFile(filename: string, content: string) {
    // only name itself is allowed here, no path
    filename = basename(filename);

    const keys = Object.getOwnPropertyNames(this.configurationFiles);

    if (keys && keys.length > 0) {
      const path = dirname(keys[0]);
      if (path.startsWith("file://")) {
        // the configuration is a file path
        // we can save the configuration file to the target location
        this.GeneratedFile.Dispatch({ content, type: "configuration", uri: `${path}/${filename}` });
      }
    }
  }

  public Dump(title: string = ""): void {
    console.log(`\n${title}\n===================================`)
    for (const each of Object.getOwnPropertyNames(this.config)) {
      console.log(`${each} : ${(<any>this.config)[each]}`);
    };
  }

  /* @internal */ public get Indexer(): ConfigurationView {

    return new Proxy<ConfigurationView>(this, {
      get: (target, property) => {
        return property in target.config ? (<any>target.config)[property] : this[<number | string>property];
      }
    });
  }

  /* @internal */ public get DataStore(): DataStore { return this.messageEmitter.DataStore; }
  /* @internal */ public get CancellationToken(): CancellationToken { return this.messageEmitter.CancellationToken; }
  /* @internal */ public get CancellationTokenSource(): CancellationTokenSource { return this.messageEmitter.CancellationTokenSource; }
  /* @internal */ public get GeneratedFile(): IEvent<MessageEmitter, Artifact> { return this.messageEmitter.GeneratedFile; }
  /* @internal */ public get ClearFolder(): IEvent<MessageEmitter, string> { return this.messageEmitter.ClearFolder; }

  private config: AutoRestConfigurationImpl;
  private rawConfig: AutoRestConfigurationImpl;

  private ResolveAsFolder(path: string): string {
    return EnsureIsFolderUri(ResolveUri(this.BaseFolderUri, path));
  }

  private ResolveAsPath(path: string): string {
    return ResolveUri(this.BaseFolderUri, path);
  }

  private get BaseFolderUri(): string {
    return EnsureIsFolderUri(ResolveUri(this.configFileFolderUri, this.config["base-folder"] as string));
  }

  // public methods

  public get UseExtensions(): Array<{ name: string, source: string, fullyQualified: string }> {
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

  public async IncludedConfigurationFiles(fileSystem: IFileSystem, ignoreFiles: Set<string>): Promise<string[]> {
    const result = new Array<string>();
    for (const each of From<string>(ValuesOf<string>(this.config["require"]))) {
      const path = this.ResolveAsPath(each);
      if (!ignoreFiles.has(path)) {
        result.push(this.ResolveAsPath(each));
      }
    }

    // for try require, see if it exists before including it in the list.
    for (const each of From<string>(ValuesOf<string>(this.config["try-require"]))) {
      const path = this.ResolveAsPath(each);
      try {
        if (!ignoreFiles.has(path) && await fileSystem.ReadFile(path)) {
          result.push(path);
          continue;
        }
      } catch {
        // skip it.
      }
      ignoreFiles.add(path);
    }

    // return the aggregate list of things we're supposed to include
    return result;
  }

  public get Directives(): DirectiveView[] {
    const plainDirectives = ValuesOf<Directive>(this.config["directive"]);
    const declarations = this.config["declare-directive"] || {};
    const expandDirective = (dir: Directive): Iterable<Directive> => {
      const makro = Object.keys(dir).filter(makro => declarations[makro])[0];
      if (!makro) {
        return [dir]; // nothing to expand
      }
      // prepare directive
      let parameters = (dir as any)[makro];
      if (!Array.isArray(parameters)) {
        parameters = [parameters];
      }
      dir = { ...dir };
      delete (dir as any)[makro];
      // call makro
      const makroResults: any = From(parameters).SelectMany(parameter => {
        // console.log(new Error().stack);
        const result = safeEval(declarations[makro], { $: parameter, $context: dir });
        return Array.isArray(result) ? result : [result];
      }).ToArray();
      return From(makroResults).SelectMany((result: any) => expandDirective(Object.assign(result, dir)));
    };
    // makro expansion
    return From(plainDirectives).SelectMany(expandDirective).Select(each => new DirectiveView(each)).ToArray();
  }

  public get InputFileUris(): string[] {
    return From<string>(ValuesOf<string>(this.config["input-file"]))
      .Select(each => this.ResolveAsPath(each))
      .ToArray();
  }

  public get OutputFolderUri(): string {
    return this.ResolveAsFolder(this.config["output-folder"] as string);
  }

  public IsOutputArtifactRequested(artifact: string): boolean {
    return From(ValuesOf<string>(this.config["output-artifact"])).Contains(artifact);
  }

  public GetEntry(key: keyof AutoRestConfigurationImpl): any {
    let result = this.config as any;
    for (const keyPart of key.split(".")) {
      result = result[keyPart];
    }
    return result;
  }

  public get Raw(): AutoRestConfigurationImpl {
    return this.config;
  }

  public get DebugMode(): boolean {
    return !!this.config["debug"];
  }

  public get VerboseMode(): boolean {
    return !!this.config["verbose"];
  }

  public get HelpRequested(): boolean {
    return !!this.config["help"];
  }

  public * GetNestedConfiguration(pluginName: string): Iterable<ConfigurationView> {
    for (const section of ValuesOf<any>((this.config as any)[pluginName])) {
      if (section) {
        yield this.GetNestedConfigurationImmediate(section === true ? {} : section);
      }
    }
  }

  public GetNestedConfigurationImmediate(...scope: any[]): ConfigurationView {
    return new ConfigurationView(this.configurationFiles, this.fileSystem, this.messageEmitter, this.configFileFolderUri, ...scope, this.config).Indexer;
  }

  // message pipeline (source map resolution, filter, ...)
  public Message(m: Message): void {
    if (m.Channel === Channel.Debug && !this.DebugMode) {
      return;
    }

    if (m.Channel === Channel.Verbose && !this.VerboseMode) {
      return;
    }

    try {
      // update source locations to point to loaded Swagger
      if (m.Source && typeof (m.Source.map) === 'function') {
        const blameSources = m.Source.map(s => {
          let blameTree: BlameTree | null = null;

          try {
            const originalPath = JSON.stringify(s.Position.path);
            let shouldComplain = false;
            while (blameTree === null) {
              try {
                blameTree = this.DataStore.Blame(s.document, s.Position);
                if (shouldComplain) {
                  this.Message({
                    Channel: Channel.Verbose,
                    Text: `\nDEVELOPER-WARNING: Path '${originalPath}' was corrected to ${JSON.stringify(s.Position.path)} on MESSAGE '${JSON.stringify(m.Text)}'\n`
                  });
                }
              } catch (e) {
                if (!shouldComplain) {
                  shouldComplain = true;
                }
                const path = s.Position.path as string[];
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
                } else {
                  throw e;
                }
              }
            }
          } catch (e) {
            this.Message({
              Channel: Channel.Warning,
              Text: `Failed to blame ${JSON.stringify(s.Position)} in '${JSON.stringify(s.document)}' (${e})`,
              Details: e
            });
            return [s];
          }

          return blameTree.BlameLeafs().map(r => <SourceLocation>{ document: r.source, Position: { ...TryDecodeEnhancedPositionFromName(r.name), line: r.line, column: r.column } });
        });

        //console.log("---");
        //console.log(JSON.stringify(m.Source, null, 2));

        m.Source = From(blameSources).SelectMany(x => x).ToArray();
        // get friendly names
        for (const source of m.Source) {
          if (source.Position) {
            try {
              source.document = this.DataStore.ReadStrictSync(source.document).Description;
            } catch (e) {

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
          const positionEnd = <sourceMap.Position>{ line: s.Position.line, column: s.Position.column + (s.Position.length || 3) };

          return <Range>{
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
                  text += ` (${stringify(source.Position.path)})`;
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
            mx.FormattedMessage = Stringify([mx.Details || mx]).replace(/^---/, "");
            break;
          default:
            let text = `${(mx.Channel || Channel.Information).toString().toUpperCase()}${mx.Key ? ` (${[...mx.Key].join("/")})` : ""}: ${mx.Text}`;
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
                    text += ` (${stringify(source.Position.path)})`;
                  }
                } catch (e) {
                  // no friendly name, so nothing more specific to show
                }
              }
            }
            mx.FormattedMessage = text;
            break;
        }
        this.messageEmitter.Message.Dispatch(mx);
      }
    } catch (e) {
      this.messageEmitter.Message.Dispatch({ Channel: Channel.Error, Text: `${e}` });
    }
  }
}

export class Configuration {
  public constructor(
    private fileSystem: IFileSystem = new RealFileSystem(),
    private configFileOrFolderUri?: string,
  ) { }

  private async ParseCodeBlocks(configFile: DataHandle, contextConfig: ConfigurationView, scope: string): Promise<AutoRestConfigurationImpl[]> {
    // load config
    const hConfig = await ParseCodeBlocks(
      contextConfig,
      configFile,
      contextConfig.DataStore.getDataSink());

    if (hConfig.length === 1 && hConfig[0].info === null && configFile.Description.toLowerCase().endsWith(".md")) {
      // this is a whole file, and it's a markdown file.
      return [];
    }

    const blocks = hConfig.filter(each => each).map(each => {
      const block = each.data.ReadObject<AutoRestConfigurationImpl>() || {};
      if (typeof block !== "object") {
        contextConfig.Message({
          Channel: Channel.Error,
          Text: "Syntax error: Invalid YAML object.",
          Source: [<SourceLocation>{ document: each.data.key, Position: { line: 1, column: 0 } }]
        });
        throw new OperationAbortedException();
      }
      block.__info = each.info;
      return block;
    });
    return blocks;
  }

  private static extensionManager: LazyPromise<ExtensionManager> = new LazyPromise<ExtensionManager>(() => ExtensionManager.Create(join(process.env["autorest.home"] || require("os").homedir(), ".autorest")));

  private async DesugarRawConfig(configs: any): Promise<any> {
    // shallow copy
    configs = Object.assign({}, configs);
    configs["use-extension"] = { ...configs["use-extension"] };

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
          } else {
            const pkg = await extMgr.findPackage("foo", useEntry);
            configs["use-extension"][pkg.name] = useEntry;
          }
        }
      }
      delete configs.use;
    }

    return configs;
  }

  private async DesugarRawConfigs(configs: any[]): Promise<any[]> {
    return Promise.all(configs.map(c => this.DesugarRawConfig(c)));
  }

  public static async shutdown() {
    try {
      AutoRestExtension.killAll();

      // once we shutdown those extensions, we should shutdown the EM too. 
      const extMgr = await Configuration.extensionManager;
      extMgr.dispose();

      // but if someone goes to use that, we're going to need a new instance (since the shared lock will be gone in the one we disposed.)
      Configuration.extensionManager = new LazyPromise<ExtensionManager>(() => ExtensionManager.Create(join(process.env["autorest.home"] || require("os").homedir(), ".autorest")))

      for (const each in loadedExtensions) {
        const ext = loadedExtensions[each];
        if (ext.autorestExtension.hasValue) {
          const extension = await ext.autorestExtension;
          extension.kill();
          delete loadedExtensions[each];
        }
      }
    } catch { }
  }

  public async CreateView(messageEmitter: MessageEmitter, includeDefault: boolean, ...configs: Array<any>): Promise<ConfigurationView> {
    const configFileUri = this.fileSystem && this.configFileOrFolderUri
      ? await Configuration.DetectConfigurationFile(this.fileSystem, this.configFileOrFolderUri, messageEmitter)
      : null;
    const configFileFolderUri = configFileUri ? ResolveUri(configFileUri, "./") : (this.configFileOrFolderUri || "file:///");

    const configurationFiles: { [key: string]: any; } = {};
    const configSegments: any[] = [];
    const createView = (segments: any[] = configSegments) => new ConfigurationView(configurationFiles, this.fileSystem, messageEmitter, configFileFolderUri, ...segments);
    const addSegments = async (configs: any[]): Promise<any[]> => { const segs = await this.DesugarRawConfigs(configs); configSegments.push(...segs); return segs; };

    // 1. overrides (CLI, ...)
    await addSegments(configs);
    // 2. file
    if (configFileUri !== null) {
      const inputView = messageEmitter.DataStore.GetReadThroughScope(this.fileSystem);

      // add loaded files to the input files.
      configurationFiles[configFileUri] = (await inputView.ReadStrict(configFileUri)).ReadData();

      const blocks = await this.ParseCodeBlocks(
        await inputView.ReadStrict(configFileUri),
        createView(),
        "config");
      await addSegments(blocks);
    }
    // 3. resolve 'require'd configuration
    const addedConfigs = new Set<string>();
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
              Channel: Channel.Verbose,
              Text: `> Including configuration file '${additionalConfig}'`
            });
            addedConfigs.add(additionalConfig);
            // merge config
            const inputView = messageEmitter.DataStore.GetReadThroughScope(this.fileSystem);
            configurationFiles[additionalConfig] = (await inputView.ReadStrict(additionalConfig)).ReadData();
            const blocks = await this.ParseCodeBlocks(
              await inputView.ReadStrict(additionalConfig),
              tmpView,
              `require-config-${additionalConfig}`);
            await addSegments(blocks);
          } catch (e) {
            messageEmitter.Message.Dispatch({
              Channel: Channel.Fatal,
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
      const inputView = messageEmitter.DataStore.GetReadThroughScope(new RealFileSystem());
      const blocks = await this.ParseCodeBlocks(
        await inputView.ReadStrict(ResolveUri(CreateFolderUri(__dirname), "../../resources/default-configuration.md")),
        createView(),
        "default-config");
      await addSegments(blocks);
    }

    await includeFn();
    const mf = createView().GetEntry('message-format');
    // 5. resolve extensions
    const extMgr = await Configuration.extensionManager;
    const addedExtensions = new Set<string>();
    const viewsToHandle: ConfigurationView[] = [createView()];
    while (viewsToHandle.length > 0) {
      const tmpView = <ConfigurationView>viewsToHandle.pop();
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
            } catch (e) { }

            if (await exists(localPath)) {
              if (mf !== 'json' && mf !== 'yaml') {
                // local package
                messageEmitter.Message.Dispatch({
                  Channel: Channel.Information,
                  Text: `> Loading local AutoRest extension '${additionalExtension.name}' (${localPath})`
                });

              }

              const pack = await extMgr.findPackage(additionalExtension.name, localPath);
              const extension = new LocalExtension(pack, localPath);
              // start extension
              ext = loadedExtensions[additionalExtension.fullyQualified] = {
                extension: extension,
                autorestExtension: new LazyPromise(async () => AutoRestExtension.FromChildProcess(additionalExtension.name, await extension.start()))
              };
            }
            else {
              // remote package
              const installedExtension = await extMgr.getInstalledExtension(additionalExtension.name, additionalExtension.source);
              if (installedExtension) {
                if (mf !== 'json' && mf !== 'yaml') {
                  messageEmitter.Message.Dispatch({
                    Channel: Channel.Information,
                    Text: `> Loading AutoRest extension '${additionalExtension.name}' (${additionalExtension.source}->${installedExtension.version})`
                  });
                }
                // start extension
                ext = loadedExtensions[additionalExtension.fullyQualified] = {
                  extension: installedExtension,
                  autorestExtension: new LazyPromise(async () => AutoRestExtension.FromChildProcess(additionalExtension.name, await installedExtension.start()))
                };
              } else {
                // acquire extension
                const pack = await extMgr.findPackage(additionalExtension.name, additionalExtension.source);
                messageEmitter.Message.Dispatch({
                  Channel: Channel.Information,
                  Text: `> Installing AutoRest extension '${additionalExtension.name}' (${additionalExtension.source})`
                });
                const cwd = process.cwd(); // TODO: fix extension?
                const extension = await extMgr.installPackage(pack, false, 5 * 60 * 1000, (progressInit: any) => progressInit.Message.Subscribe((s: any, m: any) => tmpView.Message({ Text: m, Channel: Channel.Verbose })));
                process.chdir(cwd);
                // start extension
                ext = loadedExtensions[additionalExtension.fullyQualified] = {
                  extension: extension,
                  autorestExtension: new LazyPromise(async () => AutoRestExtension.FromChildProcess(additionalExtension.name, await extension.start()))
                };
              }
            }
          }
          await includeFn();

          // merge config
          const inputView = messageEmitter.DataStore.GetReadThroughScope(new RealFileSystem());
          const blocks = await this.ParseCodeBlocks(
            await inputView.ReadStrict(CreateFileUri(await ext.extension.configurationPath)),
            createView(),
            `extension-config-${additionalExtension.fullyQualified}`);
          viewsToHandle.push(createView(await addSegments(blocks)));
        } catch (e) {
          messageEmitter.Message.Dispatch({
            Channel: Channel.Fatal,
            Text: `Failed to install or start extension '${additionalExtension.name}' (${additionalExtension.source})`
          });
          throw e;
        }
      }
    }
    return createView().Indexer;
  }
  public static async DetectConfigurationFile(fileSystem: IFileSystem, configFileOrFolderUri: string | null, messageEmitter?: MessageEmitter, walkUpFolders: boolean = false): Promise<string | null> {
    const files = await this.DetectConfigurationFiles(fileSystem, configFileOrFolderUri, messageEmitter, walkUpFolders);

    return From<string>(files).FirstOrDefault(each => each.toLowerCase().endsWith("/" + Constants.DefaultConfiguration)) ||
      From<string>(files).OrderBy(each => each.length).FirstOrDefault() || null;
  }

  public static async DetectConfigurationFiles(fileSystem: IFileSystem, configFileOrFolderUri: string | null, messageEmitter?: MessageEmitter, walkUpFolders: boolean = false): Promise<Array<string>> {
    const originalConfigFileOrFolderUri = configFileOrFolderUri;

    // null means null!
    if (!configFileOrFolderUri) {
      return [];
    }

    // try querying the Uri directly
    let content: string | null;
    try {
      content = await fileSystem.ReadFile(configFileOrFolderUri);
    } catch {
      // didn't get the file successfully, move on.
      content = null;
    }
    if (content !== null) {
      if (content.indexOf(Constants.MagicString) > -1) {
        // the file name was passed in!
        return [configFileOrFolderUri];
      }
      try {
        const ast = ParseToAst(content);
        if (ast) {
          return [configFileOrFolderUri];
        }
      } catch {
        // nope.
      }
      // this *was* an actual file passed in, not a folder. don't make this harder than it has to be.
      throw new Error(`Specified file '${originalConfigFileOrFolderUri}' is not a valid configuration file (missing magic string, see https://github.com/Azure/autorest/blob/master/docs/user/literate-file-formats/configuration.md#the-file-format).`);
    }

    // scan the filesystem items for configurations.
    const results = new Array<string>();
    for (const name of await fileSystem.EnumerateFileUris(EnsureIsFolderUri(configFileOrFolderUri))) {
      if (name.endsWith(".md")) {
        const content = await fileSystem.ReadFile(name);
        if (content.indexOf(Constants.MagicString) > -1) {
          results.push(name);
        }
      }
    }

    if (walkUpFolders) {
      // walk up
      const newUriToConfigFileOrWorkingFolder = ResolveUri(configFileOrFolderUri, "..");
      if (newUriToConfigFileOrWorkingFolder !== configFileOrFolderUri) {
        results.push(... await this.DetectConfigurationFiles(fileSystem, newUriToConfigFileOrWorkingFolder, messageEmitter, walkUpFolders))
      }
    } else {
      if (messageEmitter && results.length === 0) {
        messageEmitter.Message.Dispatch({
          Channel: Channel.Verbose,
          Text: `No configuration found at '${originalConfigFileOrFolderUri}'.`
        });
      }
    }

    return results;
  }
}