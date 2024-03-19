"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPlugin_ComponentModifier = void 0;
const yaml_1 = require("../ref/yaml");
const merging_1 = require("../source-map/merging");
const common_1 = require("./common");
function decorateSpecialProperties(o) {
    if (o["implementation"]) {
        o["x-ms-implementation"] = o["implementation"];
        delete o["implementation"];
    }
    if (o["forward-to"]) {
        o["x-ms-forward-to"] = o["forward-to"];
        delete o["forward-to"];
    }
}
function GetPlugin_ComponentModifier() {
    const noWireExtension = "x-ms-no-wire";
    return common_1.CreatePerFilePlugin(async (config) => async (fileIn, sink) => {
        const componentModifier = yaml_1.Clone(config.Raw.components);
        if (componentModifier) {
            const o = fileIn.ReadObject();
            o.components = o.components || {};
            // schemas:
            //  merge-override semantics, but decorate new properties so they're not serialized
            const schemasSource = componentModifier.schemas || {};
            const schemasTarget = o.components.schemas = o.components.schemas || {};
            for (const schemaKey of Object.keys(schemasSource)) {
                const schemaSource = schemasSource[schemaKey];
                const schemaTarget = schemasTarget[schemaKey] || {};
                // decorate properties
                if (schemaSource.properties) {
                    for (const propertyKey of Object.keys(schemaSource.properties)) {
                        const propSource = schemaSource.properties[propertyKey];
                        if (!schemaTarget.properties || !schemaTarget.properties[propertyKey]) {
                            propSource[noWireExtension] = true;
                        }
                        decorateSpecialProperties(propSource);
                    }
                }
                schemasTarget[schemaKey] = merging_1.MergeOverwriteOrAppend(schemaSource, schemaTarget);
            }
            // parameters:
            //  merge-override semantics
            const paramsSource = componentModifier.parameters || {};
            const paramsTarget = o.components.parameters = o.components.parameters || {};
            for (const paramKey of Object.keys(paramsSource)) {
                const paramSource = paramsSource[paramKey];
                const paramTarget = paramsTarget[paramKey] || {};
                paramsTarget[paramKey] = merging_1.MergeOverwriteOrAppend(paramSource, paramTarget);
            }
            // operations:
            //  merge-override semantics based on operationId, but decorate operations so they're not targetting the wire
            const operationsSource = componentModifier.operations || [];
            const operationsTarget1 = o["paths"] = o["paths"] || {};
            const operationsTarget2 = o["x-ms-paths"] = o["x-ms-paths"] || {};
            const getOperationWithId = (operationId) => {
                for (const path of [...Object.values(operationsTarget1), ...Object.values(operationsTarget2)]) {
                    for (const method of Object.keys(path)) {
                        if (path[method].operationId === operationId) {
                            return { get: () => path[method], set: x => path[method] = x };
                        }
                    }
                }
                return null;
            };
            const getDummyPath = () => {
                let path = "/dummy?" + Object.keys(operationsTarget2).length;
                while (path in operationsTarget2) {
                    path += "0";
                }
                return path;
            };
            for (const newOperation of operationsSource) {
                const operationId = newOperation.operationId || null;
                const existingOperation = operationId && getOperationWithId(operationId);
                decorateSpecialProperties(newOperation);
                if (existingOperation) {
                    existingOperation.set(merging_1.MergeOverwriteOrAppend(newOperation, existingOperation.get()));
                }
                else {
                    newOperation[noWireExtension] = true;
                    operationsTarget2[getDummyPath()] = { get: newOperation };
                }
            }
            return await sink.WriteObject(fileIn.Description, o);
        }
        return fileIn;
    });
}
exports.GetPlugin_ComponentModifier = GetPlugin_ComponentModifier;
//# sourceMappingURL=component-modifier.js.map