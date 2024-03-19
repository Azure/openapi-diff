"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComposeSwaggers = exports.LoadLiterateSwaggerOverrides = exports.LoadLiterateSwaggers = exports.LoadLiterateSwagger = exports.LoadLiterateSwaggerOverride = void 0;
const array_1 = require("../ref/array");
const text_utility_1 = require("../parsing/text-utility");
const literate_1 = require("../parsing/literate");
const message_1 = require("../message");
const exception_1 = require("../exception");
const safe_eval_1 = require("../ref/safe-eval");
const jsonpath_1 = require("../ref/jsonpath");
const yaml_1 = require("../parsing/yaml");
const yaml_2 = require("../ref/yaml");
const uri_1 = require("../ref/uri");
const linq_1 = require("../ref/linq");
const source_map_1 = require("../source-map/source-map");
const literate_yaml_1 = require("../parsing/literate-yaml");
const merging_1 = require("../source-map/merging");
let ctr = 0;
function isReferenceNode(node) {
    const lastKey = node.path[node.path.length - 1];
    return (lastKey === "$ref" || lastKey === "x-ms-odata") && typeof node.node.value === "string";
}
async function EnsureCompleteDefinitionIsPresent(config, inputScope, sink, visitedEntities, externalFiles, sourceFileUri, sourceDocObj, sourceDocMappings, currentFileUri, entityType, modelName) {
    const ensureExtFilePresent = async (fileUri, config, complaintLocation) => {
        if (!externalFiles[fileUri]) {
            const file = await inputScope.Read(fileUri);
            if (file === null) {
                config.Message({
                    Channel: message_1.Channel.Error,
                    Source: [complaintLocation],
                    Text: `Referenced file '${fileUri}' not found`
                });
                throw new exception_1.OperationAbortedException();
            }
            const externalFile = await literate_yaml_1.Parse(config, file, sink);
            externalFiles[fileUri] = externalFile;
        }
    };
    const sourceDoc = externalFiles[sourceFileUri];
    if (currentFileUri == null) {
        currentFileUri = sourceFileUri;
    }
    const references = [];
    const currentDoc = externalFiles[currentFileUri];
    const currentDocAst = currentDoc.ReadYamlAst();
    if (entityType == null || modelName == null) {
        // external references
        for (const node of yaml_2.Descendants(currentDocAst)) {
            if (isReferenceNode(node)) {
                if (!node.node.value.startsWith("#")) {
                    references.push(node);
                }
            }
        }
    }
    else {
        // references within external file
        const model = yaml_1.ResolveRelativeNode(currentDocAst, currentDocAst, [entityType, modelName]);
        for (const node of yaml_2.Descendants(model, [entityType, modelName])) {
            if (isReferenceNode(node)) {
                references.push(node);
            }
        }
    }
    const inputs = [sourceDoc];
    for (const { node, path } of references) {
        const complaintLocation = { document: currentDoc.key, Position: { path: path } };
        const refPath = node.value;
        if (refPath.indexOf("#") === -1) {
            // inject entire file right here
            const fileUri = uri_1.ResolveUri(currentFileUri, refPath);
            await ensureExtFilePresent(fileUri, config, complaintLocation);
            // console.error("Resolving ", fileUri);
            const targetPath = path.slice(0, path.length - 1);
            const extObj = externalFiles[fileUri].ReadObject();
            safe_eval_1.safeEval(`${jsonpath_1.stringify(targetPath)} = extObj`, { $: sourceDocObj, extObj: extObj });
            //// performance hit:
            // inputs.push(externalFiles[fileUri]);
            // sourceDocMappings.push(...CreateAssignmentMapping(
            //   extObj, externalFiles[fileUri].key,
            //   [], targetPath,
            //   `resolving '${refPath}' in '${currentFileUri}'`));
            // remove $ref
            sourceDocMappings = sourceDocMappings.filter(m => !jsonpath_1.IsPrefix(path, m.generated.path));
            continue;
        }
        const refPathParts = refPath.split("#").filter(s => s.length > 0);
        let fileUri = null;
        let entityPath = refPath;
        if (refPathParts.length === 2) {
            fileUri = refPathParts[0];
            entityPath = "#" + refPathParts[1];
            fileUri = uri_1.ResolveUri(currentFileUri, fileUri);
            await ensureExtFilePresent(fileUri, config, complaintLocation);
        }
        const entityPathParts = entityPath.split("/").filter(s => s.length > 0);
        const referencedEntityType = entityPathParts[1];
        const referencedModelName = entityPathParts[2];
        sourceDocObj[referencedEntityType] = sourceDocObj[referencedEntityType] || {};
        if (visitedEntities.indexOf(entityPath) === -1) {
            visitedEntities.push(entityPath);
            if (sourceDocObj[referencedEntityType][referencedModelName] === undefined) {
                if (fileUri != null) {
                    sourceDocMappings = await EnsureCompleteDefinitionIsPresent(config, inputScope, sink, visitedEntities, externalFiles, sourceFileUri, sourceDocObj, sourceDocMappings, fileUri, referencedEntityType, referencedModelName);
                    const extObj = externalFiles[fileUri].ReadObject();
                    inputs.push(externalFiles[fileUri]);
                    sourceDocObj[referencedEntityType][referencedModelName] = extObj[referencedEntityType][referencedModelName];
                    sourceDocMappings.push(...source_map_1.CreateAssignmentMapping(extObj[referencedEntityType][referencedModelName], externalFiles[fileUri].key, [referencedEntityType, referencedModelName], [referencedEntityType, referencedModelName], `resolving '${refPath}' in '${currentFileUri}'`));
                }
                else {
                    sourceDocMappings = await EnsureCompleteDefinitionIsPresent(config, inputScope, sink, visitedEntities, externalFiles, sourceFileUri, sourceDocObj, sourceDocMappings, currentFileUri, referencedEntityType, referencedModelName);
                    const currentObj = externalFiles[currentFileUri].ReadObject();
                    inputs.push(externalFiles[currentFileUri]);
                    sourceDocObj[referencedEntityType][referencedModelName] = currentObj[referencedEntityType][referencedModelName];
                    sourceDocMappings.push(...source_map_1.CreateAssignmentMapping(currentObj[referencedEntityType][referencedModelName], externalFiles[currentFileUri].key, [referencedEntityType, referencedModelName], [referencedEntityType, referencedModelName], `resolving '${refPath}' in '${currentFileUri}'`));
                }
            }
            else {
                // throw new Error(`Model definition '${entityPath}' already present`);
            }
        }
    }
    //ensure that all the models that are an allOf on the current model in the external doc are also included
    if (entityType != null && modelName != null) {
        var reference = "#/" + entityType + "/" + modelName;
        const dependentRefs = [];
        for (const node of yaml_2.Descendants(currentDocAst)) {
            const path = node.path;
            if (path.length > 3 && path[path.length - 3] === "allOf" && isReferenceNode(node) && node.node.value === reference) {
                dependentRefs.push(node);
            }
        }
        for (const dependentRef of dependentRefs) {
            //the JSON Path "definitions.ModelName.allOf[0].$ref" provides the name of the model that is an allOf on the current model
            const refs = dependentRef.path;
            const defSec = refs[0];
            const model = refs[1];
            if (typeof defSec === "string" && typeof model === "string" && visitedEntities.indexOf(`#/${defSec}/${model}`) === -1) {
                //recursively check if the model is completely defined.
                sourceDocMappings = await EnsureCompleteDefinitionIsPresent(config, inputScope, sink, visitedEntities, externalFiles, sourceFileUri, sourceDocObj, sourceDocMappings, currentFileUri, defSec, model);
                const currentObj = externalFiles[currentFileUri].ReadObject();
                inputs.push(externalFiles[currentFileUri]);
                sourceDocObj[defSec][model] = currentObj[defSec][model];
                sourceDocMappings.push(...source_map_1.CreateAssignmentMapping(currentObj[defSec][model], externalFiles[currentFileUri].key, [defSec, model], [defSec, model], `resolving '${jsonpath_1.stringify(dependentRef.path)}' (has allOf on '${reference}') in '${currentFileUri}'`));
            }
        }
    }
    // commit back
    externalFiles[sourceFileUri] = await sink.WriteObject("revision", sourceDocObj, undefined, sourceDocMappings, [...Object.getOwnPropertyNames(externalFiles).map(x => externalFiles[x]), sourceDoc] /* inputs */ /*TODO: fix*/);
    return sourceDocMappings;
}
async function StripExternalReferences(swagger, sink) {
    const ast = yaml_2.CloneAst(swagger.ReadYamlAst());
    const mapping = merging_1.IdentitySourceMapping(swagger.key, ast);
    for (const node of yaml_2.Descendants(ast)) {
        if (isReferenceNode(node)) {
            const parts = node.node.value.split("#");
            if (parts.length === 2) {
                node.node.value = "#" + node.node.value.split("#")[1];
            }
        }
    }
    return await sink.WriteData("result.yaml", yaml_2.StringifyAst(ast), undefined, mapping, [swagger]);
}
async function LoadLiterateSwaggerOverride(config, inputScope, inputFileUri, sink) {
    const commonmark = await inputScope.ReadStrict(inputFileUri);
    const rawCommonmark = commonmark.ReadData();
    const commonmarkNode = await literate_1.ParseCommonmark(rawCommonmark);
    const directives = [];
    const mappings = [];
    let transformer = [];
    const state = [...literate_1.CommonmarkSubHeadings(commonmarkNode.firstChild)].map(x => { return { node: x, query: "$" }; });
    while (state.length > 0) {
        const x = state.pop();
        if (x === undefined)
            throw "unreachable";
        // extract heading clue
        // Syntax: <regular heading> (`<query>`)
        // query syntax:
        // - implicit prefix: "@." (omitted if starts with "$." or "@.")
        // - "#<asd>" to obtain the object containing a string property containing "<asd>"
        let clue = null;
        let node = x.node.firstChild;
        while (node) {
            if ((node.literal || "").endsWith("(")
                && (((node.next || {}).next || {}).literal || "").startsWith(")")
                && node.next
                && node.next.type === "code") {
                clue = node.next.literal;
                break;
            }
            node = node.next;
        }
        // process clue
        if (clue) {
            // be explicit about relativity
            if (!clue.startsWith("@.") && !clue.startsWith("$.")) {
                clue = "@." + clue;
            }
            // make absolute
            if (clue.startsWith("@.")) {
                clue = x.query + clue.slice(1);
            }
            // replace queries
            const candidProperties = ["name", "operationId", "$ref"];
            clue = clue.replace(/\.\#(.+?)\b/g, (_, match) => `..[?(${candidProperties.map(p => `(@[${JSON.stringify(p)}] && @[${JSON.stringify(p)}].indexOf(${JSON.stringify(match)}) !== -1)`).join(" || ")})]`);
            // console.log(clue);
            // target field
            const allowedTargetFields = ["description", "summary"];
            const targetField = allowedTargetFields.filter(f => (clue || "").endsWith("." + f))[0] || "description";
            const targetPath = clue.endsWith("." + targetField) ? clue.slice(0, clue.length - targetField.length - 1) : clue;
            if (targetPath !== "$.parameters" && targetPath !== "$.definitions") {
                // add directive
                const headingTextRange = literate_1.CommonmarkHeadingFollowingText(x.node);
                const documentation = text_utility_1.Lines(rawCommonmark).slice(headingTextRange[0] - 1, headingTextRange[1]).join("\n");
                directives.push({
                    where: targetPath,
                    transform: `
            if (typeof $.${targetField} === "string" || typeof $.${targetField} === "undefined")
              $.${targetField} = ${JSON.stringify(documentation)};`
                });
            }
        }
        state.push(...[...literate_1.CommonmarkSubHeadings(x.node)].map(y => { return { node: y, query: clue || x.query }; }));
    }
    return sink.WriteObject("override-directives", { directive: directives }, undefined, mappings, [commonmark]);
}
exports.LoadLiterateSwaggerOverride = LoadLiterateSwaggerOverride;
async function LoadLiterateSwagger(config, inputScope, inputFileUri, sink) {
    const handle = await inputScope.ReadStrict(inputFileUri);
    // strict JSON check
    if (inputFileUri.toLowerCase().endsWith(".json")) {
        const error = yaml_2.StrictJsonSyntaxCheck(handle.ReadData());
        if (error) {
            config.Message({
                Channel: message_1.Channel.Error,
                Text: "Syntax Error Encountered: " + error.message,
                Source: [{ Position: text_utility_1.IndexToPosition(handle, error.index), document: handle.key }],
            });
        }
    }
    const data = await literate_yaml_1.Parse(config, handle, sink);
    // check OpenAPI version
    if (data.ReadObject().swagger !== "2.0") {
        throw new Error(`File '${inputFileUri}' is not a valid OpenAPI 2.0 definition (expected 'swagger: 2.0')`);
    }
    const externalFiles = {};
    externalFiles[inputFileUri] = data;
    await EnsureCompleteDefinitionIsPresent(config, inputScope, sink, [], externalFiles, inputFileUri, data.ReadObject(), merging_1.IdentitySourceMapping(data.key, data.ReadYamlAst()));
    const result = await StripExternalReferences(externalFiles[inputFileUri], sink);
    return result;
}
exports.LoadLiterateSwagger = LoadLiterateSwagger;
async function LoadLiterateSwaggers(config, inputScope, inputFileUris, sink) {
    const rawSwaggers = [];
    let i = 0;
    for (const inputFileUri of inputFileUris) {
        // read literate Swagger
        const pluginInput = await LoadLiterateSwagger(config, inputScope, inputFileUri, sink);
        rawSwaggers.push(pluginInput);
        i++;
    }
    return rawSwaggers;
}
exports.LoadLiterateSwaggers = LoadLiterateSwaggers;
async function LoadLiterateSwaggerOverrides(config, inputScope, inputFileUris, sink) {
    const rawSwaggers = [];
    let i = 0;
    for (const inputFileUri of inputFileUris) {
        // read literate Swagger
        const pluginInput = await LoadLiterateSwaggerOverride(config, inputScope, inputFileUri, sink);
        rawSwaggers.push(pluginInput);
        i++;
    }
    return rawSwaggers;
}
exports.LoadLiterateSwaggerOverrides = LoadLiterateSwaggerOverrides;
function getPropertyValues(obj) {
    const o = obj.obj || {};
    return Object.getOwnPropertyNames(o).map(n => getProperty(obj, n));
}
function getProperty(obj, key) {
    return { obj: obj.obj[key], path: obj.path.concat([key]) };
}
function getArrayValues(obj) {
    const o = obj.obj || [];
    return o.map((x, i) => { return { obj: x, path: obj.path.concat([i]) }; });
}
function distinct(list) {
    const sorted = list.slice().sort();
    return sorted.filter((x, i) => i === 0 || x !== sorted[i - 1]);
}
async function ComposeSwaggers(config, overrideInfoTitle, overrideInfoDescription, inputSwaggers, sink) {
    const inputSwaggerObjects = inputSwaggers.map(sw => sw.ReadObject());
    const candidateTitles = overrideInfoTitle
        ? [overrideInfoTitle]
        : distinct(inputSwaggerObjects.map(s => s.info).filter(i => !!i).map(i => i.title));
    const candidateDescriptions = overrideInfoDescription
        ? [overrideInfoDescription]
        : distinct(inputSwaggerObjects.map(s => s.info).filter(i => !!i).map(i => i.description).filter(i => !!i));
    const uniqueVersion = distinct(inputSwaggerObjects.map(s => s.info).filter(i => !!i).map(i => i.version)).length === 1;
    if (candidateTitles.length === 0)
        throw new Error(`No 'title' in provided OpenAPI definition(s).`);
    if (candidateTitles.length > 1)
        throw new Error(`The 'title' across provided OpenAPI definitions has to match. Found: ${candidateTitles.map(x => `'${x}'`).join(", ")}. Please adjust or provide an override (--title=...).`);
    if (candidateDescriptions.length !== 1)
        candidateDescriptions.splice(0, candidateDescriptions.length);
    // prepare component Swaggers (override info, lift version param, ...)
    for (let i = 0; i < inputSwaggers.length; ++i) {
        const inputSwagger = inputSwaggers[i];
        const swagger = inputSwaggerObjects[i];
        const mapping = [];
        const populate = []; // populate swagger; deferred in order to simplify source map generation
        // digest "info"
        const info = swagger.info;
        const version = info.version;
        delete info.title;
        delete info.description;
        if (!uniqueVersion)
            delete info.version;
        // extract interesting nodes
        const paths = linq_1.From([])
            .Concat(getPropertyValues(getProperty({ obj: swagger, path: [] }, "paths")))
            .Concat(getPropertyValues(getProperty({ obj: swagger, path: [] }, "x-ms-paths")));
        const methods = paths.SelectMany(getPropertyValues);
        const parameters = methods.SelectMany((method) => getArrayValues(getProperty(method, "parameters"))).Concat(paths.SelectMany((path) => getArrayValues(getProperty(path, "parameters"))));
        // inline api-version params
        if (!uniqueVersion) {
            const clientParams = swagger.parameters || {};
            const apiVersionClientParamName = Object.getOwnPropertyNames(clientParams).filter(n => clientParams[n].name === "api-version")[0];
            const apiVersionClientParam = apiVersionClientParamName ? clientParams[apiVersionClientParamName] : null;
            if (apiVersionClientParam) {
                const apiVersionClientParam = clientParams[apiVersionClientParamName];
                const apiVersionParameters = parameters.Where((p) => p.obj.$ref === `#/parameters/${apiVersionClientParamName}`);
                for (let apiVersionParameter of apiVersionParameters) {
                    delete apiVersionParameter.obj.$ref;
                    // forward client param
                    populate.push(() => Object.assign(apiVersionParameter.obj, apiVersionClientParam));
                    mapping.push(...source_map_1.CreateAssignmentMapping(apiVersionClientParam, inputSwagger.key, ["parameters", apiVersionClientParamName], apiVersionParameter.path, "inlining api-version"));
                    // make constant
                    populate.push(() => apiVersionParameter.obj.enum = [version]);
                    mapping.push({
                        name: "inlining api-version", source: inputSwagger.key,
                        original: { path: ["info", "version"] },
                        generated: { path: apiVersionParameter.path.concat("enum") }
                    });
                    mapping.push({
                        name: "inlining api-version", source: inputSwagger.key,
                        original: { path: ["info", "version"] },
                        generated: { path: apiVersionParameter.path.concat("enum", 0) }
                    });
                }
                // remove api-version client param
                delete clientParams[apiVersionClientParamName];
            }
        }
        // inline produces/consumes
        for (const pc of ["produces", "consumes"]) {
            const clientPC = swagger[pc];
            if (clientPC) {
                for (const method of methods) {
                    if (typeof method.obj === "object" && !Array.isArray(method.obj) && !method.obj[pc]) {
                        populate.push(() => method.obj[pc] = yaml_2.Clone(clientPC));
                        mapping.push(...source_map_1.CreateAssignmentMapping(clientPC, inputSwagger.key, [pc], method.path.concat([pc]), `inlining ${pc}`));
                    }
                }
            }
            delete swagger[pc];
        }
        // finish source map
        array_1.pushAll(mapping, merging_1.IdentitySourceMapping(inputSwagger.key, yaml_2.ToAst(swagger)));
        // populate object
        populate.forEach(f => f());
        // write back
        inputSwaggers[i] = await sink.WriteObject("prepared", swagger, undefined, mapping, [inputSwagger]);
    }
    let hSwagger = await merging_1.MergeYamls(config, inputSwaggers, sink, true);
    // override info section
    const info = { title: candidateTitles[0] };
    if (candidateDescriptions[0])
        info.description = candidateDescriptions[0];
    const hInfo = await sink.WriteObject("info.yaml", { info: info });
    hSwagger = await merging_1.MergeYamls(config, [hSwagger, hInfo], sink);
    return hSwagger;
}
exports.ComposeSwaggers = ComposeSwaggers;
//# sourceMappingURL=swagger-loader.js.map