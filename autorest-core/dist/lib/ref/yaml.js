"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrictJsonSyntaxCheck = exports.FastStringify = exports.Stringify = exports.Parse = exports.ToAst = exports.Normalize = exports.Clone = exports.StringifyAst = exports.CloneAst = exports.ParseNode = exports.ResolveAnchorRef = exports.Descendants = exports.ParseToAst = exports.CreateYAMLScalar = exports.CreateYAMLMapping = exports.CreateYAMLMap = exports.CreateYAMLAnchorRef = exports.Kind = void 0;
// TODO: the following is only required because safeDump of "yaml-ast-parser" has this bug: https://github.com/mulesoft-labs/yaml-ast-parser/issues/30
// PLEASE: remove the entire dependency to js-yaml once that is fixed!
const { safeDump } = require("js-yaml");
const yamlAst = require("yaml-ast-parser");
const stable_object_1 = require("../parsing/stable-object");
/**
 * reexport required elements
 */
var yaml_ast_parser_1 = require("yaml-ast-parser");
Object.defineProperty(exports, "newScalar", { enumerable: true, get: function () { return yaml_ast_parser_1.newScalar; } });
exports.Kind = yamlAst.Kind;
exports.CreateYAMLAnchorRef = yamlAst.newAnchorRef;
exports.CreateYAMLMap = yamlAst.newMap;
exports.CreateYAMLMapping = yamlAst.newMapping;
exports.CreateYAMLScalar = yamlAst.newScalar;
/**
 * Parsing
*/
function ParseToAst(rawYaml) {
    return yamlAst.safeLoad(rawYaml);
}
exports.ParseToAst = ParseToAst;
function* Descendants(yamlAstNode, currentPath = [], deferResolvingMappings = false) {
    const todos = [{ path: currentPath, node: yamlAstNode }];
    let todo;
    while (todo = todos.pop()) {
        // report self
        yield todo;
        // traverse
        if (todo.node) {
            switch (todo.node.kind) {
                case exports.Kind.MAPPING:
                    {
                        let astSub = todo.node;
                        if (deferResolvingMappings) {
                            todos.push({ node: astSub.value, path: todo.path });
                        }
                        else {
                            todos.push({ node: astSub.value, path: todo.path.concat([astSub.key.value]) });
                        }
                    }
                    break;
                case exports.Kind.MAP:
                    if (deferResolvingMappings) {
                        for (let mapping of todo.node.mappings) {
                            todos.push({ node: mapping, path: todo.path.concat([mapping.key.value]) });
                        }
                    }
                    else {
                        for (let mapping of todo.node.mappings) {
                            todos.push({ node: mapping, path: todo.path });
                        }
                    }
                    break;
                case exports.Kind.SEQ:
                    {
                        let astSub = todo.node;
                        for (let i = 0; i < astSub.items.length; ++i) {
                            todos.push({ node: astSub.items[i], path: todo.path.concat([i]) });
                        }
                    }
                    break;
            }
        }
    }
}
exports.Descendants = Descendants;
function ResolveAnchorRef(yamlAstRoot, anchorRef) {
    for (let yamlAstNode of Descendants(yamlAstRoot)) {
        if (yamlAstNode.node.anchorId === anchorRef) {
            return yamlAstNode;
        }
    }
    throw new Error(`Anchor '${anchorRef}' not found`);
}
exports.ResolveAnchorRef = ResolveAnchorRef;
/**
 * Populates yamlNode.valueFunc with a function that creates a *mutable* object (i.e. no caching of the reference or such)
 */
function ParseNodeInternal(yamlRootNode, yamlNode, onError) {
    if (!yamlNode) {
        return () => null;
    }
    const errors = yamlNode.errors.filter(_ => !_.isWarning);
    if (errors.length > 0) {
        for (const error of errors) {
            onError(`Syntax error: ${error.reason}`, error.mark.position);
        }
        return yamlNode.valueFunc = () => null;
    }
    if (yamlNode.valueFunc) {
        return yamlNode.valueFunc;
    }
    // important for anchors!
    const memoize = (factory) => cache => {
        if (cache.has(yamlNode))
            return cache.get(yamlNode);
        const result = factory(cache, o => cache.set(yamlNode, o));
        cache.set(yamlNode, result);
        return result;
    };
    switch (yamlNode.kind) {
        case exports.Kind.SCALAR: {
            const yamlNodeScalar = yamlNode;
            return yamlNode.valueFunc = yamlNodeScalar.valueObject !== undefined
                ? memoize(() => yamlNodeScalar.valueObject)
                : memoize(() => yamlNodeScalar.value);
        }
        case exports.Kind.MAPPING:
            onError("Syntax error: Encountered bare mapping.", yamlNode.startPosition);
            return yamlNode.valueFunc = () => null;
        case exports.Kind.MAP: {
            const yamlNodeMapping = yamlNode;
            return yamlNode.valueFunc = memoize((cache, set) => {
                const result = stable_object_1.NewEmptyObject();
                set(result);
                for (const mapping of yamlNodeMapping.mappings) {
                    if (mapping.key.kind !== exports.Kind.SCALAR) {
                        onError("Syntax error: Only scalar keys are allowed as mapping keys.", mapping.key.startPosition);
                    }
                    else if (mapping.value === null) {
                        onError("Syntax error: No mapping value found.", mapping.key.endPosition);
                    }
                    else {
                        result[mapping.key.value] = ParseNodeInternal(yamlRootNode, mapping.value, onError)(cache);
                    }
                }
                return result;
            });
        }
        case exports.Kind.SEQ: {
            const yamlNodeSequence = yamlNode;
            return yamlNode.valueFunc = memoize((cache, set) => {
                const result = [];
                set(result);
                for (const item of yamlNodeSequence.items) {
                    result.push(ParseNodeInternal(yamlRootNode, item, onError)(cache));
                }
                return result;
            });
        }
        case exports.Kind.ANCHOR_REF: {
            const yamlNodeRef = yamlNode;
            const ref = ResolveAnchorRef(yamlRootNode, yamlNodeRef.referencesAnchor).node;
            return memoize(cache => ParseNodeInternal(yamlRootNode, ref, onError)(cache));
        }
        case exports.Kind.INCLUDE_REF:
            onError("Syntax error: INCLUDE_REF not implemented.", yamlNode.startPosition);
            return yamlNode.valueFunc = () => null;
        default:
            throw new Error("Unknown YAML node kind.");
    }
}
function ParseNode(yamlNode, onError = message => { throw new Error(message); }) {
    ParseNodeInternal(yamlNode, yamlNode, onError);
    if (!yamlNode) {
        return (undefined);
    }
    return yamlNode.valueFunc(new WeakMap());
}
exports.ParseNode = ParseNode;
function CloneAst(ast) {
    if (ast.kind === exports.Kind.MAPPING) {
        const astMapping = ast;
        return exports.CreateYAMLMapping(CloneAst(astMapping.key), CloneAst(astMapping.value));
    }
    return ParseToAst(StringifyAst(ast));
}
exports.CloneAst = CloneAst;
function StringifyAst(ast) {
    return FastStringify(ParseNode(ast));
}
exports.StringifyAst = StringifyAst;
function Clone(object) {
    if (object === undefined)
        return object;
    return Parse(FastStringify(object));
}
exports.Clone = Clone;
/**
 * Normalizes the order of given object's keys (sorts recursively)
 */
function Normalize(object) {
    const seen = new WeakSet();
    const clone = Clone(object);
    const norm = (o) => {
        if (Array.isArray(o)) {
            o.forEach(norm);
        }
        else if (o && typeof o == "object") {
            if (seen.has(o)) {
                return;
            }
            seen.add(o);
            const keys = Object.keys(o).sort();
            const oo = Object.assign({}, o);
            for (const k of keys) {
                delete o[k];
            }
            for (const k of keys) {
                norm(o[k] = oo[k]);
            }
        }
    };
    norm(clone);
    return clone;
}
exports.Normalize = Normalize;
function ToAst(object) {
    return ParseToAst(FastStringify(object));
}
exports.ToAst = ToAst;
function Parse(rawYaml, onError = message => { throw new Error(message); }) {
    const node = ParseToAst(rawYaml);
    const result = ParseNode(node, onError);
    return result;
}
exports.Parse = Parse;
function Stringify(object) {
    return "---\n" + safeDump(object, { skipInvalid: true });
}
exports.Stringify = Stringify;
function FastStringify(obj) {
    // has duplicate objects?
    const seen = new WeakSet();
    const losslessJsonSerializable = (o) => {
        if (o && typeof o == "object") {
            if (seen.has(o))
                return false;
            seen.add(o);
        }
        if (Array.isArray(o)) {
            return o.every(losslessJsonSerializable);
        }
        else if (o && typeof o == "object") {
            return Object.values(o).every(losslessJsonSerializable);
        }
        return true;
    };
    if (losslessJsonSerializable(obj)) {
        try {
            return JSON.stringify(obj, null, 1);
        }
        catch (_a) { }
    }
    return Stringify(obj);
}
exports.FastStringify = FastStringify;
function StrictJsonSyntaxCheck(json) {
    try {
        // quick check on data.
        JSON.parse(json);
    }
    catch (e) {
        if (e instanceof SyntaxError) {
            const message = "" + e.message;
            try {
                return { message: message.substring(0, message.lastIndexOf("at")).trim(), index: parseInt(e.message.substring(e.message.lastIndexOf(" ")).trim()) };
            }
            catch (_a) { }
        }
    }
    return null;
}
exports.StrictJsonSyntaxCheck = StrictJsonSyntaxCheck;
//# sourceMappingURL=yaml.js.map