"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmitArtifacts = void 0;
const lazy_1 = require("../lazy");
const yaml_1 = require("../ref/yaml");
const merging_1 = require("../source-map/merging");
const message_1 = require("../message");
function IsOutputArtifactOrMapRequested(config, artifactType) {
    return config.IsOutputArtifactRequested(artifactType) || config.IsOutputArtifactRequested(artifactType + ".map");
}
async function EmitArtifactInternal(config, artifactType, uri, handle) {
    config.Message({ Channel: message_1.Channel.Debug, Text: `Emitting '${artifactType}' at ${uri}` });
    const emitArtifact = (artifact) => {
        if (artifact.uri.startsWith("stdout://")) {
            config.Message({
                Channel: message_1.Channel.Information,
                Details: artifact,
                Text: `Artifact '${artifact.uri.slice("stdout://".length)}' of type '${artifact.type}' has been emitted.`,
                Plugin: "emitter"
            });
        }
        else {
            config.GeneratedFile.Dispatch(artifact);
        }
    };
    if (config.IsOutputArtifactRequested(artifactType)) {
        const content = handle.ReadData();
        if (content !== "") {
            emitArtifact({
                type: artifactType,
                uri: uri,
                content: content
            });
        }
    }
    if (config.IsOutputArtifactRequested(artifactType + ".map")) {
        emitArtifact({
            type: artifactType + ".map",
            uri: uri + ".map",
            content: JSON.stringify(handle.ReadMetadata().inputSourceMap.Value, null, 2)
        });
    }
}
let emitCtr = 0;
async function EmitArtifact(config, uri, handle, isObject) {
    const artifactType = handle.GetArtifact();
    await EmitArtifactInternal(config, artifactType, uri, handle);
    if (isObject) {
        const sink = config.DataStore.getDataSink();
        const object = new lazy_1.Lazy(() => handle.ReadObject());
        const ast = new lazy_1.Lazy(() => handle.ReadYamlAst());
        if (IsOutputArtifactOrMapRequested(config, artifactType + ".yaml")) {
            const h = await sink.WriteData(`${++emitCtr}.yaml`, yaml_1.Stringify(object.Value), artifactType, merging_1.IdentitySourceMapping(handle.key, ast.Value), [handle]);
            await EmitArtifactInternal(config, artifactType + ".yaml", uri + ".yaml", h);
        }
        if (IsOutputArtifactOrMapRequested(config, artifactType + ".norm.yaml")) {
            const h = await sink.WriteData(`${++emitCtr}.norm.yaml`, yaml_1.Stringify(yaml_1.Normalize(object.Value)), artifactType, merging_1.IdentitySourceMapping(handle.key, ast.Value), [handle]);
            await EmitArtifactInternal(config, artifactType + ".norm.yaml", uri + ".norm.yaml", h);
        }
        if (IsOutputArtifactOrMapRequested(config, artifactType + ".json")) {
            const h = await sink.WriteData(`${++emitCtr}.json`, JSON.stringify(object.Value, null, 2), artifactType, merging_1.IdentitySourceMapping(handle.key, ast.Value), [handle]);
            await EmitArtifactInternal(config, artifactType + ".json", uri + ".json", h);
        }
        if (IsOutputArtifactOrMapRequested(config, artifactType + ".norm.json")) {
            const h = await sink.WriteData(`${++emitCtr}.norm.json`, JSON.stringify(yaml_1.Normalize(object.Value), null, 2), artifactType, merging_1.IdentitySourceMapping(handle.key, ast.Value), [handle]);
            await EmitArtifactInternal(config, artifactType + ".norm.json", uri + ".norm.json", h);
        }
    }
}
async function EmitArtifacts(config, artifactTypeFilter /* what's set on the emitter */, uriResolver, scope, isObject) {
    for (const key of await scope.Enum()) {
        const file = await scope.ReadStrict(key);
        const fileArtifact = file.GetArtifact();
        const ok = artifactTypeFilter ?
            typeof artifactTypeFilter === "string" ? fileArtifact === artifactTypeFilter : // A string filter is a singular type
                Array.isArray(artifactTypeFilter) ? artifactTypeFilter.includes(fileArtifact) : // an array is any one of the types
                    true : // if it's not a string or array, just emit it (no filter)
            true; // if it's null, just emit it.
        if (ok) {
            await EmitArtifact(config, uriResolver(file.Description), file, isObject);
        }
    }
}
exports.EmitArtifacts = EmitArtifacts;
//# sourceMappingURL=artifact-emitter.js.map