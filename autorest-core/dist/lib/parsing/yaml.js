"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertJsonx2Yaml = exports.ConvertYaml2Jsonx = exports.CreateEnhancedPosition = exports.ResolvePath = exports.ReplaceNode = exports.ResolveRelativeNode = void 0;
const yaml_1 = require("../ref/yaml");
const jsonpath_1 = require("../ref/jsonpath");
const text_utility_1 = require("./text-utility");
function ResolveMapProperty(node, property) {
    for (let mapping of node.mappings) {
        if (property === mapping.key.value) {
            return mapping;
        }
    }
    return null;
}
/**
 * Resolves the YAML node given a path PathComponent.
 * @param yamlAstRoot            Root node of AST (required for resolving anchor references)
 * @param yamlAstCurrent         Current AST node to start resolving from
 * @param jsonPathPart           Path component to resolve
 * @param deferResolvingMappings If set to true, if resolving to a mapping, will return the entire mapping node instead of just the value (useful if desiring keys)
 */
function ResolvePathPart(yamlAstRoot, yamlAstCurrent, jsonPathPart, deferResolvingMappings) {
    switch (yamlAstCurrent.kind) {
        case yaml_1.Kind.SCALAR:
            throw new Error(`Trying to retrieve '${jsonPathPart}' from scalar value`);
        case yaml_1.Kind.MAPPING: {
            let astSub = yamlAstCurrent;
            if (deferResolvingMappings) {
                return ResolvePathPart(yamlAstRoot, astSub.value, jsonPathPart, deferResolvingMappings);
            }
            if (jsonPathPart.toString() !== astSub.key.value) {
                throw new Error(`Trying to retrieve '${jsonPathPart}' from mapping with key '${astSub.key.value}'`);
            }
            return astSub.value;
        }
        case yaml_1.Kind.MAP: {
            let astSub = yamlAstCurrent;
            const mapping = ResolveMapProperty(astSub, jsonPathPart.toString());
            if (mapping !== null) {
                return deferResolvingMappings
                    ? mapping
                    : ResolvePathPart(yamlAstRoot, mapping, jsonPathPart, deferResolvingMappings);
            }
            throw new Error(`Trying to retrieve '${jsonPathPart}' from mapping that contains no such key`);
        }
        case yaml_1.Kind.SEQ: {
            let astSub = yamlAstCurrent;
            if (typeof jsonPathPart !== "number") {
                throw new Error(`Trying to retrieve non-string item '${jsonPathPart}' from sequence`);
            }
            if (0 > jsonPathPart || jsonPathPart >= astSub.items.length) {
                throw new Error(`Trying to retrieve item '${jsonPathPart}' from sequence with '${astSub.items.length}' items (index out of bounds)`);
            }
            return astSub.items[jsonPathPart];
        }
        case yaml_1.Kind.ANCHOR_REF: {
            let astSub = yamlAstCurrent;
            let newCurrent = yaml_1.ResolveAnchorRef(yamlAstRoot, astSub.referencesAnchor).node;
            return ResolvePathPart(yamlAstRoot, newCurrent, jsonPathPart, deferResolvingMappings);
        }
        case yaml_1.Kind.INCLUDE_REF:
            throw new Error(`INCLUDE_REF not implemented`);
    }
    throw new Error(`unexpected YAML AST node kind '${yamlAstCurrent.kind}'`);
}
function ResolveRelativeNode(yamlAstRoot, yamlAstCurrent, jsonPath) {
    try {
        for (const jsonPathPart of jsonPath) {
            yamlAstCurrent = ResolvePathPart(yamlAstRoot, yamlAstCurrent, jsonPathPart, true);
        }
        return yamlAstCurrent;
    }
    catch (error) {
        throw new Error(`Error retrieving '${jsonpath_1.stringify(jsonPath)}' (${error})`);
    }
}
exports.ResolveRelativeNode = ResolveRelativeNode;
function ReplaceNode(yamlAstRoot, target, value) {
    // root replacement?
    if (target === yamlAstRoot) {
        return value;
    }
    const parent = target.kind === yaml_1.Kind.MAPPING ? target : target.parent;
    switch (parent.kind) {
        case yaml_1.Kind.MAPPING: {
            const astSub = parent;
            // replace the mapping's value
            if (value !== undefined && value.kind !== yaml_1.Kind.MAPPING) {
                astSub.value = value;
                return yamlAstRoot;
            }
            // replace the mapping
            const parentMap = parent.parent;
            const index = parentMap.mappings.indexOf(astSub);
            if (value !== undefined) {
                parentMap.mappings[index] = value;
            }
            else {
                parentMap.mappings = parentMap.mappings.filter((x, i) => i !== index);
            }
            return yamlAstRoot;
        }
        case yaml_1.Kind.SEQ: {
            const astSub = parent;
            const index = astSub.items.indexOf(target);
            if (value !== undefined) {
                astSub.items[index] = value;
            }
            else {
                astSub.items = astSub.items.filter((x, i) => i !== index);
            }
            return yamlAstRoot;
        }
    }
    throw new Error(`unexpected YAML AST node kind '${parent.kind}' for a parent`);
}
exports.ReplaceNode = ReplaceNode;
/**
 * Resolves the text position of a JSON path in raw YAML.
 */
function ResolvePath(yamlFile, jsonPath) {
    //let node = (await (await yamlFile.ReadMetadata()).resolvePathCache)[stringify(jsonPath)];
    const yamlAst = yamlFile.ReadYamlAst();
    const node = ResolveRelativeNode(yamlAst, yamlAst, jsonPath);
    return CreateEnhancedPosition(yamlFile, jsonPath, node);
}
exports.ResolvePath = ResolvePath;
function CreateEnhancedPosition(yamlFile, jsonPath, node) {
    const startIdx = jsonPath.length === 0 ? 0 : node.startPosition;
    const endIdx = node.endPosition;
    const startPos = text_utility_1.IndexToPosition(yamlFile, startIdx);
    const endPos = text_utility_1.IndexToPosition(yamlFile, endIdx);
    const result = { column: startPos.column, line: startPos.line };
    result.path = jsonPath;
    // enhance
    if (node.kind === yaml_1.Kind.MAPPING) {
        const mappingNode = node;
        result.length = mappingNode.key.endPosition - mappingNode.key.startPosition;
        result.valueOffset = mappingNode.value.startPosition - mappingNode.key.startPosition;
        result.valueLength = mappingNode.value.endPosition - mappingNode.value.startPosition;
    }
    else {
        result.length = endIdx - startIdx;
        result.valueOffset = 0;
        result.valueLength = result.length;
    }
    return result;
}
exports.CreateEnhancedPosition = CreateEnhancedPosition;
/**
 * REPRESENTATION
 */
/**
 * rewrites anchors to $id/$$ref
 */
function ConvertYaml2Jsonx(ast) {
    ast = yaml_1.CloneAst(ast);
    for (const nodeWithPath of yaml_1.Descendants(ast)) {
        const node = nodeWithPath.node;
        if (node.anchorId) {
            if (node.kind === yaml_1.Kind.MAP) {
                const yamlNodeMapping = node;
                yamlNodeMapping.mappings.push(yaml_1.CreateYAMLMapping(yaml_1.CreateYAMLScalar("$id"), yaml_1.CreateYAMLScalar(node.anchorId)));
            }
            node.anchorId = undefined;
        }
        if (node.kind === yaml_1.Kind.ANCHOR_REF) {
            const yamlNodeAnchor = node;
            const map = yaml_1.CreateYAMLMap();
            map.mappings.push(yaml_1.CreateYAMLMapping(yaml_1.CreateYAMLScalar("$$ref"), yaml_1.CreateYAMLScalar(yamlNodeAnchor.referencesAnchor)));
            ReplaceNode(ast, yamlNodeAnchor, map);
        }
    }
    return ast;
}
exports.ConvertYaml2Jsonx = ConvertYaml2Jsonx;
/**
 * rewrites $id/$ref/$$ref to anchors
 */
function ConvertJsonx2Yaml(ast) {
    ast = yaml_1.CloneAst(ast);
    for (const nodeWithPath of yaml_1.Descendants(ast)) {
        const node = nodeWithPath.node;
        if (node.kind === yaml_1.Kind.MAP) {
            const yamlNodeMapping = node;
            const propId = ResolveMapProperty(yamlNodeMapping, "$id");
            let propRef = ResolveMapProperty(yamlNodeMapping, "$ref");
            const propReff = ResolveMapProperty(yamlNodeMapping, "$$ref");
            if (propRef && isNaN(parseInt(yaml_1.ParseNode(propRef.value) + ""))) {
                propRef = null;
            }
            propRef = propRef || propReff;
            if (propId) {
                yamlNodeMapping.anchorId = yaml_1.ParseNode(propId.value) + "";
                ReplaceNode(ast, propId, undefined);
            }
            else if (propRef) {
                ReplaceNode(ast, yamlNodeMapping, yaml_1.CreateYAMLAnchorRef(yaml_1.ParseNode(propRef.value) + ""));
            }
        }
    }
    return ast;
}
exports.ConvertJsonx2Yaml = ConvertJsonx2Yaml;
//# sourceMappingURL=yaml.js.map