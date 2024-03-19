"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluateGuard = exports.ParseCodeBlocks = exports.Parse = exports.CodeBlock = void 0;
const exception_1 = require("../exception");
const yaml_1 = require("../ref/yaml");
const merging_1 = require("../source-map/merging");
const literate_1 = require("./literate");
const text_utility_1 = require("./text-utility");
const message_1 = require("../message");
const safe_eval_1 = require("../ref/safe-eval");
class CodeBlock {
}
exports.CodeBlock = CodeBlock;
function TryMarkdown(rawMarkdownOrYaml) {
    return /^#/gm.test(rawMarkdownOrYaml);
}
async function Parse(config, literate, sink) {
    const hRawDoc = await ParseInternal(config, literate, sink);
    return hRawDoc;
}
exports.Parse = Parse;
async function ParseCodeBlocks(config, literate, sink) {
    return await ParseCodeBlocksInternal(config, literate, sink);
}
exports.ParseCodeBlocks = ParseCodeBlocks;
async function ParseInternal(config, hLiterate, sink) {
    // merge the parsed codeblocks
    const blocks = (await ParseCodeBlocksInternal(config, hLiterate, sink)).map(each => each.data);
    return await merging_1.MergeYamls(config, blocks, sink);
}
async function ParseCodeBlocksInternal(config, hLiterate, sink) {
    let hsConfigFileBlocks = [];
    const rawMarkdown = hLiterate.ReadData();
    // try parsing as literate YAML
    if (TryMarkdown(rawMarkdown)) {
        const hsConfigFileBlocksWithContext = await literate_1.Parse(hLiterate, sink);
        for (const { data, codeBlock } of hsConfigFileBlocksWithContext) {
            // only consider YAML/JSON blocks
            if (!/^(yaml|json)/i.test(codeBlock.info || "")) {
                continue;
            }
            // super-quick JSON block syntax check.
            if (/^(json)/i.test(codeBlock.info || "")) {
                // check syntax on JSON blocks with simple check first
                const error = yaml_1.StrictJsonSyntaxCheck(data.ReadData());
                if (error) {
                    config.Message({
                        Channel: message_1.Channel.Error,
                        Text: "Syntax Error Encountered: " + error.message,
                        Source: [{ Position: text_utility_1.IndexToPosition(data, error.index), document: data.key }],
                    });
                    throw new exception_1.OperationAbortedException();
                }
            }
            let failing = false;
            const ast = data.ReadYamlAst();
            // quick syntax check.
            yaml_1.ParseNode(ast, async (message, index) => {
                failing = true;
                config.Message({
                    Channel: message_1.Channel.Error,
                    Text: "Syntax Error Encountered: " + message,
                    Source: [{ Position: text_utility_1.IndexToPosition(data, index), document: data.key }],
                });
            });
            if (failing) {
                throw new exception_1.OperationAbortedException();
            }
            // fairly confident of no immediate syntax errors.
            hsConfigFileBlocks.push({ info: codeBlock.info, data: data });
        }
    }
    // fall back to raw YAML
    if (hsConfigFileBlocks.length === 0) {
        hsConfigFileBlocks = [{ info: null, data: hLiterate }];
    }
    return hsConfigFileBlocks;
}
function EvaluateGuard(rawFenceGuard, contextObject) {
    // trim the language from the front first
    let match = /^\S*\s*(.*)/.exec(rawFenceGuard);
    let fence = match && match[1];
    if (!fence) {
        // no fence at all.
        return true;
    }
    let guardResult = false;
    let expressionFence = '';
    try {
        if (!fence.includes("$(")) {
            try {
                return safe_eval_1.safeEval(fence);
            }
            catch (e) {
                return false;
            }
        }
        expressionFence = `${merging_1.resolveRValue(fence, "", contextObject, null, 2)}`;
        // is there unresolved values?  May be old-style. Or the values aren't defined. 
        // Let's run it only if there are no unresolved values for now. 
        if (!expressionFence.includes("$(")) {
            return safe_eval_1.safeEval(expressionFence);
        }
    }
    catch (E) {
        // not a legal expression?
    }
    // is this a single $( ... ) expression ?
    match = /^\$\((.*)\)$/.exec(fence.trim());
    const guardExpression = match && !match[1].includes("$(") && match[1];
    if (!guardExpression) {
        // Nope. this isn't an old style expression.
        // at best, it can be an expression that doesn't have all the values resolved.
        // let's resolve them to undefined and see what happens.
        // console.log(`${fence} => ${expressionFence.replace(/\$\(.*?\)/g, 'undefined')}`)
        try {
            return safe_eval_1.safeEval(expressionFence.replace(/\$\(.*?\)/g, 'undefined'));
        }
        catch (_a) {
            return safe_eval_1.safeEval(fence.replace(/\$\(.*?\)/g, 'undefined'));
        }
    }
    // fall back to original behavior, where the whole expression is in the $( ... )
    const context = Object.assign({ $: contextObject }, contextObject);
    try {
        //console.log(`${fence} => ${guardExpression}`);
        guardResult = safe_eval_1.safeEval(guardExpression, context);
    }
    catch (e) {
        try {
            guardResult = safe_eval_1.safeEval("$['" + guardExpression + "']", context);
        }
        catch (e) {
            // at this point, it can only be an single-value expression that isn't resolved
            // which means return 'false'
        }
    }
    return guardResult;
}
exports.EvaluateGuard = EvaluateGuard;
//# sourceMappingURL=literate-yaml.js.map