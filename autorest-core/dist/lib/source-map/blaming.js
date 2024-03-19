"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlameTree = void 0;
const source_map_1 = require("./source-map");
const linq_1 = require("../ref/linq");
class BlameTree {
    constructor(node, blaming) {
        this.node = node;
        this.blaming = blaming;
    }
    static Create(dataStore, position) {
        const data = dataStore.ReadStrictSync(position.source);
        const blames = data.Blame(position);
        // propagate smart position
        const enhanced = source_map_1.TryDecodeEnhancedPositionFromName(position.name);
        if (enhanced !== undefined) {
            for (const blame of blames) {
                blame.name = source_map_1.EncodeEnhancedPositionInName(blame.name, Object.assign(Object.assign({}, enhanced), source_map_1.TryDecodeEnhancedPositionFromName(blame.name)));
            }
        }
        return new BlameTree(position, blames.map(pos => BlameTree.Create(dataStore, pos)));
    }
    BlameLeafs() {
        const result = [];
        const todos = [this];
        let todo;
        while (todo = todos.pop()) {
            // report self
            if (todo.blaming.length === 0) {
                result.push({
                    column: todo.node.column,
                    line: todo.node.line,
                    name: todo.node.name,
                    source: todo.node.source
                });
            }
            // recurse
            todos.push(...todo.blaming);
        }
        return linq_1.From(result).Distinct(x => JSON.stringify(x)).ToArray();
    }
}
exports.BlameTree = BlameTree;
//# sourceMappingURL=blaming.js.map