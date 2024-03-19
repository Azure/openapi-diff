"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonmarkHeadingFollowingText = exports.CommonmarkHeadingText = exports.CommonmarkSubHeadings = exports.ParseCommonmark = exports.Parse = void 0;
const commonmark = require("../ref/commonmark");
async function Parse(hConfigFile, sink) {
    const result = [];
    const rawMarkdown = hConfigFile.ReadData();
    for (const codeBlock of ParseCodeblocks(rawMarkdown)) {
        const codeBlockKey = `codeBlock_${codeBlock.sourcepos[0][0]}`;
        const data = codeBlock.literal || "";
        const mappings = GetSourceMapForCodeBlock(hConfigFile.key, codeBlock);
        const hCodeBlock = await sink.WriteData(codeBlockKey, data, undefined, mappings, [hConfigFile]);
        result.push({
            data: hCodeBlock,
            codeBlock: codeBlock
        });
    }
    return result;
}
exports.Parse = Parse;
function GetSourceMapForCodeBlock(sourceFileName, codeBlock) {
    const result = [];
    const numLines = codeBlock.sourcepos[1][0] - codeBlock.sourcepos[0][0] + (codeBlock.info === null ? 1 : -1);
    for (var i = 0; i < numLines; ++i) {
        result.push({
            generated: {
                line: i + 1,
                column: 0
            },
            original: {
                line: i + codeBlock.sourcepos[0][0] + (codeBlock.info === null ? 0 : 1),
                column: codeBlock.sourcepos[0][1] - 1
            },
            source: sourceFileName,
            name: `Codeblock line '${i + 1}'`
        });
    }
    return result;
}
function ParseCommonmark(markdown) {
    return new commonmark.Parser().parse(markdown);
}
exports.ParseCommonmark = ParseCommonmark;
function* ParseCodeblocks(markdown) {
    const parsed = ParseCommonmark(markdown);
    const walker = parsed.walker();
    let event;
    while ((event = walker.next())) {
        var node = event.node;
        if (event.entering && node.type === "code_block") {
            yield node;
        }
    }
}
const commonmarkHeadingNodeType = "heading";
const commonmarkHeadingMaxLevel = 1000;
function CommonmarkParentHeading(startNode) {
    const currentLevel = startNode.type === commonmarkHeadingNodeType
        ? startNode.level
        : commonmarkHeadingMaxLevel;
    let resultNode = startNode;
    while (resultNode != null && (resultNode.type !== commonmarkHeadingNodeType || resultNode.level >= currentLevel)) {
        resultNode = resultNode.prev || resultNode.parent;
    }
    return resultNode;
}
function* CommonmarkSubHeadings(startNode) {
    if (startNode && (startNode.type === commonmarkHeadingNodeType || !startNode.prev)) {
        const currentLevel = startNode.level;
        let maxLevel = commonmarkHeadingMaxLevel;
        startNode = startNode.next;
        while (startNode != null) {
            if (startNode.type === commonmarkHeadingNodeType) {
                if (currentLevel < startNode.level) {
                    if (startNode.level <= maxLevel) {
                        maxLevel = startNode.level;
                        yield startNode;
                    }
                }
                else {
                    break;
                }
            }
            startNode = startNode.next;
        }
    }
}
exports.CommonmarkSubHeadings = CommonmarkSubHeadings;
function CommonmarkHeadingText(headingNode) {
    let text = "";
    let node = headingNode.firstChild;
    while (node) {
        text += node.literal;
        node = node.next;
    }
    return text;
}
exports.CommonmarkHeadingText = CommonmarkHeadingText;
function CommonmarkHeadingFollowingText(headingNode) {
    let subNode = headingNode.next;
    if (subNode === null) {
        throw new Error("No node found after heading node");
    }
    const startPos = subNode.sourcepos[0];
    while (subNode.next
        && subNode.next.type !== "code_block"
        && (subNode.next.type !== commonmarkHeadingNodeType /* || subNode.next.level > headingNode.level*/)) {
        subNode = subNode.next;
    }
    const endPos = subNode.sourcepos[1];
    return [startPos[0], endPos[0]];
}
exports.CommonmarkHeadingFollowingText = CommonmarkHeadingFollowingText;
//# sourceMappingURL=literate.js.map