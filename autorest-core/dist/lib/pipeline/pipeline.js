"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunPipeline = void 0;
const component_modifier_1 = require("./component-modifier");
const schema_validation_1 = require("./schema-validation");
const yaml_1 = require("../parsing/yaml");
const yaml_2 = require("../ref/yaml");
const jsonpath_1 = require("../ref/jsonpath");
const safe_eval_1 = require("../ref/safe-eval");
const outstanding_task_awaiter_1 = require("../outstanding-task-awaiter");
const manipulation_1 = require("./manipulation");
const commonmark_documentation_1 = require("./commonmark-documentation");
const message_1 = require("../message");
const uri_1 = require("../ref/uri");
const configuration_1 = require("../configuration");
const data_store_1 = require("../data-store/data-store");
const artifact_emitter_1 = require("./artifact-emitter");
const swagger_loader_1 = require("./swagger-loader");
const conversion_1 = require("../openapi/conversion");
const help_1 = require("./help");
const metadata_generation_1 = require("./metadata-generation");
const common_1 = require("./common");
;
function GetPlugin_Identity() {
    return async (config, input) => input;
}
function GetPlugin_Loader() {
    return async (config, input, sink) => {
        let inputs = config.InputFileUris;
        const swaggers = await swagger_loader_1.LoadLiterateSwaggers(config, input, inputs, sink);
        const result = [];
        for (let i = 0; i < inputs.length; ++i) {
            result.push(await sink.Forward(inputs[i], swaggers[i]));
        }
        return new data_store_1.QuickDataSource(result);
    };
}
function GetPlugin_MdOverrideLoader() {
    return async (config, input, sink) => {
        let inputs = config.InputFileUris;
        const swaggers = await swagger_loader_1.LoadLiterateSwaggerOverrides(config, input, inputs, sink);
        const result = [];
        for (let i = 0; i < inputs.length; ++i) {
            result.push(await sink.Forward(inputs[i], swaggers[i]));
        }
        return new data_store_1.QuickDataSource(result);
    };
}
function GetPlugin_OAI2toOAIx() {
    return common_1.CreatePerFilePlugin(async (config) => async (fileIn, sink) => {
        const fileOut = await conversion_1.ConvertOAI2toOAI3(fileIn, sink);
        return await sink.Forward(fileIn.Description, fileOut);
    });
}
function GetPlugin_Yaml2Jsonx() {
    return common_1.CreatePerFilePlugin(async (config) => async (fileIn, sink) => {
        let ast = fileIn.ReadYamlAst();
        ast = yaml_1.ConvertYaml2Jsonx(ast);
        return await sink.WriteData(fileIn.Description, yaml_2.StringifyAst(ast));
    });
}
function GetPlugin_Jsonx2Yaml() {
    return common_1.CreatePerFilePlugin(async (config) => async (fileIn, sink) => {
        let ast = fileIn.ReadYamlAst();
        ast = yaml_1.ConvertJsonx2Yaml(ast);
        return await sink.WriteData(fileIn.Description, yaml_2.StringifyAst(ast));
    });
}
function GetPlugin_Transformer() {
    return common_1.CreatePerFilePlugin(async (config) => {
        const isObject = config.GetEntry("is-object") === false ? false : true;
        const manipulator = new manipulation_1.Manipulator(config);
        return async (fileIn, sink) => {
            const fileOut = await manipulator.Process(fileIn, sink, isObject, fileIn.Description);
            return await sink.Forward(fileIn.Description, fileOut);
        };
    });
}
function GetPlugin_TransformerImmediate() {
    return async (config, input, sink) => {
        const isObject = config.GetEntry("is-object") === false ? false : true;
        const files = await input.Enum(); // first all the immediate-configs, then a single swagger-document
        const scopes = await Promise.all(files.slice(0, files.length - 1).map(f => input.ReadStrict(f)));
        const manipulator = new manipulation_1.Manipulator(config.GetNestedConfigurationImmediate(...scopes.map(s => s.ReadObject())));
        const file = files[files.length - 1];
        const fileIn = await input.ReadStrict(file);
        const fileOut = await manipulator.Process(fileIn, sink, isObject, fileIn.Description);
        return new data_store_1.QuickDataSource([await sink.Forward("swagger-document", fileOut)]);
    };
}
function GetPlugin_Composer() {
    return async (config, input, sink) => {
        const swaggers = await Promise.all((await input.Enum()).map(x => input.ReadStrict(x)));
        const overrideInfo = config.GetEntry("override-info");
        const overrideTitle = (overrideInfo && overrideInfo.title) || config.GetEntry("title");
        const overrideDescription = (overrideInfo && overrideInfo.description) || config.GetEntry("description");
        const swagger = await swagger_loader_1.ComposeSwaggers(config, overrideTitle, overrideDescription, swaggers, sink);
        return new data_store_1.QuickDataSource([await sink.Forward("composed", swagger)]);
    };
}
function GetPlugin_External(host, pluginName) {
    return async (config, input, sink) => {
        const plugin = await host;
        const pluginNames = await plugin.GetPluginNames(config.CancellationToken);
        if (pluginNames.indexOf(pluginName) === -1) {
            throw new Error(`Plugin ${pluginName} not found.`);
        }
        const results = [];
        const result = await plugin.Process(pluginName, key => config.GetEntry(key), config, input, sink, f => results.push(f), config.Message.bind(config), config.CancellationToken);
        if (!result) {
            throw new Error(`Plugin ${pluginName} reported failure.`);
        }
        return new data_store_1.QuickDataSource(results);
    };
}
function GetPlugin_CommonmarkProcessor() {
    return async (config, input, sink) => {
        const files = await input.Enum();
        const results = [];
        for (let file of files) {
            const fileIn = await input.ReadStrict(file);
            const fileOut = await commonmark_documentation_1.ProcessCodeModel(fileIn, sink);
            file = file.substr(file.indexOf("/output/") + "/output/".length);
            results.push(await sink.Forward("code-model-v1", fileOut));
        }
        return new data_store_1.QuickDataSource(results);
    };
}
function GetPlugin_ArtifactEmitter(inputOverride) {
    return async (config, input, sink) => {
        if (inputOverride) {
            input = await inputOverride();
        }
        // clear output-folder if requested
        if (config.GetEntry("clear-output-folder")) {
            config.ClearFolder.Dispatch(config.OutputFolderUri);
        }
        await artifact_emitter_1.EmitArtifacts(config, config.GetEntry("input-artifact") || null, key => uri_1.ResolveUri(config.OutputFolderUri, safe_eval_1.safeEval(config.GetEntry("output-uri-expr") || "$key", { $key: key, $config: config.Raw })), input, config.GetEntry("is-object"));
        return new data_store_1.QuickDataSource([]);
    };
}
function BuildPipeline(config) {
    const cfgPipeline = config.GetEntry("pipeline");
    const pipeline = {};
    const configCache = {};
    // Resolves a pipeline stage name using the current stage's name and the relative name.
    // It considers the actually existing pipeline stages.
    // Example:
    // (csharp/cm/transform, commonmarker)
    //    --> csharp/cm/commonmarker       if such a stage exists
    //    --> csharp/commonmarker          if such a stage exists
    //    --> commonmarker                 if such a stage exists
    //    --> THROWS                       otherwise
    const resolvePipelineStageName = (currentStageName, relativeName) => {
        while (currentStageName !== "") {
            currentStageName = currentStageName.substring(0, currentStageName.length - 1);
            currentStageName = currentStageName.substring(0, currentStageName.lastIndexOf("/") + 1);
            if (cfgPipeline[currentStageName + relativeName]) {
                return currentStageName + relativeName;
            }
        }
        throw new Error(`Cannot resolve pipeline stage '${relativeName}'.`);
    };
    // One pipeline stage can generate multiple nodes in the pipeline graph
    // if the stage is associated with a configuration scope that has multiple entries.
    // Example: multiple generator calls
    const createNodesAndSuffixes = stageName => {
        const cfg = cfgPipeline[stageName];
        if (!cfg) {
            throw new Error(`Cannot find pipeline stage '${stageName}'.`);
        }
        if (cfg.suffixes) {
            return { name: stageName, suffixes: cfg.suffixes };
        }
        // derive information about given pipeline stage
        const plugin = cfg.plugin || stageName.split("/").reverse()[0];
        const outputArtifact = cfg["output-artifact"];
        const scope = cfg.scope;
        const inputs = (!cfg.input ? [] : (Array.isArray(cfg.input) ? cfg.input : [cfg.input])).map((x) => resolvePipelineStageName(stageName, x));
        const suffixes = [];
        // adds nodes using at least suffix `suffix`, the input nodes called `inputs` using the context `config`
        // AFTER considering all the input nodes `inputNodes`
        // Example:
        // ("", [], cfg, [{ name: "a", suffixes: ["/0", "/1"] }])
        // --> ("/0", ["a/0"], cfg of "a/0", [])
        //     --> adds node `${stageName}/0`
        // --> ("/1", ["a/1"], cfg of "a/1", [])
        //     --> adds node `${stageName}/1`
        // Note: inherits the config of the LAST input node (affects for example `.../generate`)
        const addNodesAndSuffixes = (suffix, inputs, configScope, inputNodes) => {
            if (inputNodes.length === 0) {
                const config = configCache[jsonpath_1.stringify(configScope)];
                const configs = scope ? [...config.GetNestedConfiguration(scope)] : [config];
                for (let i = 0; i < configs.length; ++i) {
                    const newSuffix = configs.length === 1 ? "" : "/" + i;
                    suffixes.push(suffix + newSuffix);
                    const path = configScope.slice();
                    if (scope)
                        path.push(scope);
                    if (configs.length !== 1)
                        path.push(i);
                    configCache[jsonpath_1.stringify(path)] = configs[i];
                    pipeline[stageName + suffix + newSuffix] = {
                        pluginName: plugin,
                        outputArtifact: outputArtifact,
                        configScope: path,
                        inputs: inputs
                    };
                }
            }
            else {
                const inputSuffixesHead = inputNodes[0];
                const inputSuffixesTail = inputNodes.slice(1);
                for (const inputSuffix of inputSuffixesHead.suffixes) {
                    const additionalInput = inputSuffixesHead.name + inputSuffix;
                    addNodesAndSuffixes(suffix + inputSuffix, inputs.concat([additionalInput]), pipeline[additionalInput].configScope, inputSuffixesTail);
                }
            }
        };
        configCache[jsonpath_1.stringify([])] = config;
        addNodesAndSuffixes("", [], [], inputs.map(createNodesAndSuffixes));
        return { name: stageName, suffixes: cfg.suffixes = suffixes };
    };
    for (const pipelineStepName of Object.keys(cfgPipeline)) {
        createNodesAndSuffixes(pipelineStepName);
    }
    return {
        pipeline: pipeline,
        configs: configCache
    };
}
async function RunPipeline(configView, fileSystem) {
    // built-in plugins
    const plugins = {
        "help": help_1.GetPlugin_Help(),
        "identity": GetPlugin_Identity(),
        "loader": GetPlugin_Loader(),
        "md-override-loader": GetPlugin_MdOverrideLoader(),
        "transform": GetPlugin_Transformer(),
        "transform-immediate": GetPlugin_TransformerImmediate(),
        "compose": GetPlugin_Composer(),
        "schema-validator": schema_validation_1.GetPlugin_SchemaValidator(),
        // TODO: replace with OAV again
        "semantic-validator": GetPlugin_Identity(),
        "openapi-document-converter": GetPlugin_OAI2toOAIx(),
        "component-modifiers": component_modifier_1.GetPlugin_ComponentModifier(),
        "yaml2jsonx": GetPlugin_Yaml2Jsonx(),
        "jsonx2yaml": GetPlugin_Jsonx2Yaml(),
        "reflect-api-versions-cs": metadata_generation_1.GetPlugin_ReflectApiVersion(),
        "commonmarker": GetPlugin_CommonmarkProcessor(),
        "emitter": GetPlugin_ArtifactEmitter(),
        "pipeline-emitter": GetPlugin_ArtifactEmitter(async () => new data_store_1.QuickDataSource([await configView.DataStore.getDataSink().WriteObject("pipeline", pipeline.pipeline, "pipeline")])),
        "configuration-emitter": GetPlugin_ArtifactEmitter(async () => new data_store_1.QuickDataSource([await configView.DataStore.getDataSink().WriteObject("configuration", configView.Raw, "configuration")]))
    };
    // dynamically loaded, auto-discovered plugins
    const __extensionExtension = {};
    for (const useExtensionQualifiedName of configView.GetEntry("used-extension") || []) {
        const extension = await configuration_1.GetExtension(useExtensionQualifiedName);
        for (const plugin of await extension.GetPluginNames(configView.CancellationToken)) {
            if (!plugins[plugin]) {
                plugins[plugin] = GetPlugin_External(extension, plugin);
                __extensionExtension[plugin] = extension;
            }
        }
    }
    // __status scope
    const startTime = Date.now();
    configView.Raw.__status = new Proxy({}, {
        get(_, key) {
            if (key === "__info")
                return false;
            const expr = Buffer.from(key.toString(), "base64").toString("ascii");
            try {
                return yaml_2.FastStringify(safe_eval_1.safeEval(expr, {
                    pipeline: pipeline.pipeline,
                    external: __extensionExtension,
                    tasks: tasks,
                    startTime: startTime,
                    blame: (uri, position /*TODO: cleanup, nail type*/) => configView.DataStore.Blame(uri, position)
                }));
            }
            catch (e) {
                return "" + e;
            }
        }
    });
    // TODO: think about adding "number of files in scope" kind of validation in between pipeline steps
    const fsInput = configView.DataStore.GetReadThroughScope(fileSystem);
    const pipeline = BuildPipeline(configView);
    const ScheduleNode = async (nodeName) => {
        const node = pipeline.pipeline[nodeName];
        if (!node) {
            throw new Error(`Cannot find pipeline node ${nodeName}.`);
        }
        // get input
        const inputScopes = await Promise.all(node.inputs.map(getTask));
        let inputScope;
        if (inputScopes.length === 0) {
            inputScope = fsInput;
        }
        else {
            const handles = [];
            for (const pscope of inputScopes) {
                const scope = await pscope;
                for (const handle of await scope.Enum()) {
                    handles.push(await scope.ReadStrict(handle));
                }
            }
            inputScope = new data_store_1.QuickDataSource(handles);
        }
        const config = pipeline.configs[jsonpath_1.stringify(node.configScope)];
        const pluginName = node.pluginName;
        const plugin = plugins[pluginName];
        if (!plugin) {
            throw new Error(`Plugin '${pluginName}' not found.`);
        }
        try {
            config.Message({ Channel: message_1.Channel.Debug, Text: `${nodeName} - START` });
            const scopeResult = await plugin(config, inputScope, config.DataStore.getDataSink(node.outputArtifact));
            config.Message({ Channel: message_1.Channel.Debug, Text: `${nodeName} - END` });
            return scopeResult;
        }
        catch (e) {
            config.Message({ Channel: message_1.Channel.Fatal, Text: `${nodeName} - FAILED` });
            config.Message({ Channel: message_1.Channel.Fatal, Text: `${e}` });
            throw e;
        }
    };
    // schedule pipeline
    const tasks = {};
    const getTask = (name) => name in tasks ?
        tasks[name] :
        tasks[name] = ScheduleNode(name);
    // execute pipeline
    const barrier = new outstanding_task_awaiter_1.OutstandingTaskAwaiter();
    const barrierRobust = new outstanding_task_awaiter_1.OutstandingTaskAwaiter();
    for (const name of Object.keys(pipeline.pipeline)) {
        const task = getTask(name);
        const taskx = task;
        taskx._state = "running";
        task.then(async (x) => {
            const res = await Promise.all((await x.Enum()).map(key => x.ReadStrict(key)));
            taskx._result = () => res;
            taskx._state = "complete";
            taskx._finishedAt = Date.now();
        }).catch(() => taskx._state = "failed");
        barrier.Await(task);
        barrierRobust.Await(task.catch(() => { }));
    }
    try {
        await barrier.Wait();
    }
    catch (e) {
        // wait for outstanding nodes
        try {
            await barrierRobust.Wait();
        }
        catch (_a) {
            // wait for others to fail or whatever...
        }
        throw e;
    }
}
exports.RunPipeline = RunPipeline;
//# sourceMappingURL=pipeline.js.map