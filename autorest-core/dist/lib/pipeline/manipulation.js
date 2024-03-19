"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Manipulator = void 0;
const jsonpath_1 = require("../ref/jsonpath");
const safe_eval_1 = require("../ref/safe-eval");
const object_manipulator_1 = require("./object-manipulator");
const linq_1 = require("../ref/linq");
const message_1 = require("../message");
class Manipulator {
    constructor(config) {
        this.config = config;
        this.ctr = 0;
        this.transformations = config.Directives;
    }
    MatchesSourceFilter(document, transform, artifact) {
        document = "/" + document;
        // from
        const from = linq_1.From(transform.from);
        const matchesFrom = !from.Any() || from
            .Any(d => artifact === d ||
            document.endsWith("/" + d));
        // console.log(matchesFrom, document, artifact, [...transform.from]);
        return matchesFrom;
    }
    async ProcessInternal(data, sink, documentId) {
        for (const trans of this.transformations) {
            // matches filter?
            if (this.MatchesSourceFilter(documentId || data.key, trans, data.GetArtifact())) {
                for (const w of trans.where) {
                    // transform
                    for (const t of trans.transform) {
                        const result = await object_manipulator_1.ManipulateObject(data, sink, w, (doc, obj, path) => safe_eval_1.safeEval(`(() => { { ${t} }; return $; })()`, { $: obj, $doc: doc, $path: path }) /*,
                        {
                          reason: trans.reason,
                          transformerSourceHandle: // TODO
                        }*/);
                        if (!result.anyHit) {
                            // this.config.Message({
                            //   Channel: Channel.Warning,
                            //   Details: trans,
                            //   Text: `Transformation directive with 'where' clause '${w}' was not used.`
                            // });
                        }
                        data = result.result;
                    }
                    // test
                    for (const t of trans.test) {
                        const doc = data.ReadObject();
                        const allHits = jsonpath_1.nodes(doc, w);
                        for (const hit of allHits) {
                            let testResults = [...safe_eval_1.safeEval(`(function* () { ${t.indexOf("yield") === -1 ? `yield (${t}\n)` : `${t}\n`} })()`, { $: hit.value, $doc: doc, $path: hit.path })];
                            for (const testResult of testResults) {
                                if (testResult === false || typeof testResult !== "boolean") {
                                    const messageText = typeof testResult === "string" ? testResult : "Custom test failed";
                                    const message = testResult.Text
                                        ? testResult
                                        : { Text: messageText, Channel: message_1.Channel.Warning, Details: testResult };
                                    message.Source = message.Source || [{ Position: { path: hit.path } }];
                                    for (const src of message.Source) {
                                        src.document = src.document || data.key;
                                    }
                                    this.config.Message(message);
                                }
                            }
                        }
                        if (allHits.length === 0) {
                            // this.config.Message({
                            //   Channel: Channel.Warning,
                            //   Details: trans,
                            //   Text: `Test directive with 'where' clause '${w}' was not used.`
                            // });
                        }
                    }
                }
            }
        }
        return data;
    }
    async Process(data, sink, isObject, documentId) {
        const trans1 = !isObject ? await sink.WriteObject(`trans_input?${data.key}`, data.ReadData()) : data;
        const result = await this.ProcessInternal(trans1, sink, documentId);
        const trans2 = !isObject ? await sink.WriteData(`trans_output?${data.key}`, result.ReadObject()) : result;
        return trans2;
    }
}
exports.Manipulator = Manipulator;
//# sourceMappingURL=manipulation.js.map