"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManipulateObject = void 0;
const merging_1 = require("../source-map/merging");
const yaml_1 = require("../ref/yaml");
const yaml_2 = require("../parsing/yaml");
const jsonpath_1 = require("../ref/jsonpath");
const linq_1 = require("../ref/linq");
async function ManipulateObject(src, target, whereJsonQuery, transformer, // transforming to `undefined` results in removal
mappingInfo) {
    // find paths matched by `whereJsonQuery`
    let ast = yaml_1.CloneAst(src.ReadYamlAst());
    const doc = yaml_1.ParseNode(ast);
    const hits = jsonpath_1.nodes(doc, whereJsonQuery).sort((a, b) => a.path.length - b.path.length);
    if (hits.length === 0) {
        return { anyHit: false, result: src };
    }
    // process
    const mapping = merging_1.IdentitySourceMapping(src.key, ast).filter(m => !hits.some(hit => jsonpath_1.IsPrefix(hit.path, m.generated.path)));
    for (const hit of hits) {
        if (ast === undefined) {
            throw new Error("Cannot remove root node.");
        }
        const newObject = transformer(doc, yaml_1.Clone(hit.value), hit.path);
        const newAst = newObject === undefined
            ? undefined
            : yaml_1.ToAst(newObject); // <- can extend ToAst to also take an "ambient" object with AST, in order to create anchor refs for existing stuff!
        const oldAst = yaml_2.ResolveRelativeNode(ast, ast, hit.path);
        ast = yaml_2.ReplaceNode(ast, oldAst, newAst) || (() => { throw new Error("Cannot remove root node."); })();
        // patch source map
        if (newAst !== undefined) {
            const reasonSuffix = mappingInfo ? ` (${mappingInfo.reason})` : "";
            if (mappingInfo) {
                mapping.push(...linq_1.From(yaml_1.Descendants(newAst)).Select((descendant) => {
                    return {
                        name: `Injected object at '${jsonpath_1.stringify(hit.path)}'${reasonSuffix}`,
                        source: mappingInfo.transformerSourceHandle.key,
                        original: mappingInfo.transformerSourcePosition,
                        generated: { path: hit.path.concat(descendant.path) }
                    };
                }));
            }
            // try to be smart and assume that nodes existing in both old and new AST have a relationship
            mapping.push(...linq_1.From(yaml_1.Descendants(newAst))
                .Where((descendant) => jsonpath_1.paths(doc, jsonpath_1.stringify(hit.path.concat(descendant.path))).length === 1)
                .Select((descendant) => {
                return {
                    name: `Original object at '${jsonpath_1.stringify(hit.path)}'${reasonSuffix}`,
                    source: src.key,
                    original: { path: hit.path.concat(descendant.path) },
                    generated: { path: hit.path.concat(descendant.path) }
                };
            }));
        }
    }
    // write back
    const resultHandle = await target.WriteData("manipulated", yaml_1.StringifyAst(ast), undefined, mapping, mappingInfo ? [src, mappingInfo.transformerSourceHandle] : [src]);
    return {
        anyHit: true,
        result: resultHandle
    };
}
exports.ManipulateObject = ManipulateObject;
//# sourceMappingURL=object-manipulator.js.map