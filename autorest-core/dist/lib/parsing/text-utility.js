"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexToPosition = exports.Lines = exports.LineIndices = void 0;
const regexNewLine = /\r?\n/g;
function LineIndices(text) {
    let indices = [0];
    let match;
    while ((match = regexNewLine.exec(text)) !== null) {
        indices.push(match.index + match[0].length);
    }
    return indices;
}
exports.LineIndices = LineIndices;
function Lines(text) {
    return text.split(regexNewLine);
}
exports.Lines = Lines;
function IndexToPosition(text, index) {
    const startIndices = typeof text === "string" ? LineIndices(text) : text.ReadMetadata().lineIndices.Value;
    // bin. search for last `<item> <= index`
    let lineIndexMin = 0;
    let lineIndexMax = startIndices.length;
    while (lineIndexMin < lineIndexMax - 1) {
        const lineIndex = (lineIndexMin + lineIndexMax) / 2 | 0;
        if (startIndices[lineIndex] <= index) {
            lineIndexMin = lineIndex;
        }
        else {
            lineIndexMax = lineIndex;
        }
    }
    return {
        column: index - startIndices[lineIndexMin],
        line: 1 + lineIndexMin,
    };
}
exports.IndexToPosition = IndexToPosition;
//# sourceMappingURL=text-utility.js.map