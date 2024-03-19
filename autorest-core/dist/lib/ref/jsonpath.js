"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJsonPointer = exports.matches = exports.CreateObject = exports.IsPrefix = exports.nodes = exports.paths = exports.stringify = exports.parse = void 0;
const safe_eval_1 = require("./safe-eval");
const jsonpath = require("jsonpath");
// patch in smart filter expressions
const handlers = jsonpath.handlers;
handlers.register("subscript-descendant-filter_expression", function (component, partial, count) {
    const src = component.expression.value.slice(1);
    const passable = function (key, value) {
        try {
            return safe_eval_1.safeEval(src.replace(/\@/g, "$$$$"), { "$$": value });
        }
        catch (e) {
            return false;
        }
    };
    return eval("this").traverse(partial, null, passable, count);
});
handlers.register("subscript-child-filter_expression", function (component, partial, count) {
    const src = component.expression.value.slice(1);
    const passable = function (key, value) {
        try {
            return safe_eval_1.safeEval(src.replace(/\@/g, "$$$$"), { "$$": value });
        }
        catch (e) {
            return false;
        }
    };
    return eval("this").descend(partial, null, passable, count);
});
function parse(jsonPath) {
    return jsonpath.parse(jsonPath).map(part => part.expression.value).slice(1);
}
exports.parse = parse;
function stringify(jsonPath) {
    return jsonpath.stringify(["$"].concat(jsonPath));
}
exports.stringify = stringify;
function paths(obj, jsonQuery) {
    return nodes(obj, jsonQuery).map(x => x.path);
}
exports.paths = paths;
function nodes(obj, jsonQuery) {
    // jsonpath only accepts objects
    if (obj instanceof Object) {
        let result = jsonpath.nodes(obj, jsonQuery).map(x => { return { path: x.path.slice(1), value: x.value }; });
        const comp = (a, b) => a < b ? -1 : (a > b ? 1 : 0);
        result = result.sort((a, b) => comp(JSON.stringify(a.path), JSON.stringify(b.path)));
        result = result.filter((x, i) => i === 0 || JSON.stringify(x.path) !== JSON.stringify(result[i - 1].path));
        return result;
    }
    else {
        return matches(jsonQuery, []) ? [{ path: [], value: obj }] : [];
    }
}
exports.nodes = nodes;
function IsPrefix(prefix, path) {
    if (prefix.length > path.length) {
        return false;
    }
    for (let i = 0; i < prefix.length; ++i) {
        if (prefix[i] !== path[i]) {
            return false;
        }
    }
    return true;
}
exports.IsPrefix = IsPrefix;
function CreateObject(jsonPath, leafObject) {
    let obj = leafObject;
    for (const jsonPathComponent of jsonPath.slice().reverse()) {
        obj = typeof jsonPathComponent === "number"
            ? (() => { const result = Array.apply(null, Array(jsonPathComponent + 1)); result[jsonPathComponent] = obj; return result; })()
            : (() => { const result = {}; result[jsonPathComponent] = obj; return result; })();
    }
    return obj;
}
exports.CreateObject = CreateObject;
function matches(jsonQuery, jsonPath) {
    // build dummy object from `jsonPath`
    const leafNode = new Object();
    const obj = CreateObject(jsonPath, leafNode);
    // check that `jsonQuery` on that object returns the `leafNode`
    return nodes(obj, jsonQuery).some(res => res.value === leafNode);
}
exports.matches = matches;
function parseJsonPointer(jsonPointer) {
    return jsonPointer.split("/").slice(1).map(part => part.replace(/~1/g, "/").replace(/~0/g, "~"));
}
exports.parseJsonPointer = parseJsonPointer;
//# sourceMappingURL=jsonpath.js.map