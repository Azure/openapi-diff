"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessCodeModel = exports.PlainTextVersion = void 0;
const commonmark_1 = require("../ref/commonmark");
const yaml_1 = require("../ref/yaml");
const merging_1 = require("../source-map/merging");
function IsDocumentationField(node) {
    if (!node || !node.node.value || !node.node.value.value || typeof node.node.value.value !== "string") {
        return false;
    }
    const path = node.path;
    if (path.length < 2) {
        return false;
    }
    if (path[path.length - 2] === "x-ms-examples") {
        return false;
    }
    const last = path[path.length - 1];
    return last === "Description" || last === "Summary";
}
function PlainTextVersion(commonmarkAst) {
    let result = "";
    const walker = commonmarkAst.walker();
    let event;
    while ((event = walker.next())) {
        const node = event.node;
        // console.log(node);
        switch (node.type) {
            case "text":
                result += node.literal;
                break;
            case "code":
                result += node.literal;
                break;
            case "softbreak":
                result += " ";
                break;
            case "paragraph":
                if (!event.entering) {
                    result += "\n";
                }
                break;
            case "heading":
                if (!event.entering) {
                    result += "\n";
                }
                break;
        }
    }
    return result.trim();
}
exports.PlainTextVersion = PlainTextVersion;
async function ProcessCodeModel(codeModel, sink) {
    const ast = yaml_1.CloneAst(codeModel.ReadYamlAst());
    let mapping = merging_1.IdentitySourceMapping(codeModel.key, ast);
    const cmParser = new commonmark_1.Parser();
    // transform
    for (const d of yaml_1.Descendants(ast, [], true)) {
        if (d.node.kind === yaml_1.Kind.MAPPING && IsDocumentationField(d)) {
            const node = d.node;
            const rawMarkdown = node.value.value;
            // inject new child for original value into parent
            const parent = node.parent;
            const nodeOriginal = yaml_1.CloneAst(node);
            const key = nodeOriginal.key.value;
            const origKey = key + "_Original";
            nodeOriginal.key.value = origKey;
            parent.mappings.push(nodeOriginal);
            mapping.push({
                name: "original gfm",
                generated: { path: d.path.map((x, i) => i === d.path.length - 1 ? origKey : x) },
                original: { path: d.path },
                source: codeModel.key
            });
            // sanitize
            const parsed = cmParser.parse(rawMarkdown);
            const plainText = PlainTextVersion(parsed);
            node.value = yaml_1.CreateYAMLScalar(plainText);
        }
    }
    return await sink.WriteData("codeModel.yaml", yaml_1.StringifyAst(ast), undefined, mapping, [codeModel]);
}
exports.ProcessCodeModel = ProcessCodeModel;
//# sourceMappingURL=commonmark-documentation.js.map