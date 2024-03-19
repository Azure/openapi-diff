"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateConfiguration = exports.isLegacy = void 0;
const path_1 = require("path");
/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
const uri_1 = require("./lib/ref/uri");
const regexLegacyArg = /^-[^-]/;
/* @internal */ function isLegacy(args) {
    return args.some(arg => regexLegacyArg.test(arg));
}
exports.isLegacy = isLegacy;
async function ParseCompositeSwagger(inputScope, uri, targetConfig) {
    const compositeSwaggerFile = await inputScope.ReadStrict(uri);
    const data = compositeSwaggerFile.ReadObject();
    const documents = data.documents;
    targetConfig["input-file"] = documents.map(d => uri_1.ResolveUri(uri, d));
    // forward info section
    targetConfig["override-info"] = data.info;
}
/* @internal */ async function CreateConfiguration(baseFolderUri, inputScope, args) {
    let result = {
        "input-file": []
    };
    const switches = {};
    // parse
    let lastValue = null;
    for (const arg of args.slice().reverse()) {
        if (arg.startsWith("-")) {
            switches[arg.substr(1).toLowerCase()] = lastValue;
            lastValue = null;
        }
        else {
            lastValue = arg;
        }
    }
    // extract
    const inputFile = switches["i"] || switches["input"];
    if (inputFile === null) {
        throw new Error("No input specified.");
    }
    result["input-file"] = inputFile;
    result["output-folder"] = switches["o"] || switches["output"] || switches["outputdirectory"] || "Generated";
    result["namespace"] = switches["n"] || switches["namespace"] || uri_1.GetFilenameWithoutExtension(inputFile);
    const modeler = switches["m"] || switches["modeler"] || "Swagger";
    if (modeler === "CompositeSwagger") {
        await ParseCompositeSwagger(inputScope, uri_1.ResolveUri(baseFolderUri, inputFile), result);
    }
    const codegenerator = switches["g"] || switches["codegenerator"] || "CSharp";
    const usedCodeGenerator = codegenerator.toLowerCase().replace("azure.", "").replace(".fluent", "");
    if (codegenerator.toLowerCase() === "none") {
        result["azure-validator"] = true;
        result["openapi-type"] = "arm";
    }
    else {
        result[usedCodeGenerator] = {};
        if (codegenerator.toLowerCase().startsWith("azure.")) {
            result[usedCodeGenerator]["azure-arm"] = true;
        }
        if (codegenerator.toLowerCase().endsWith(".fluent")) {
            result["fluent"] = true;
        }
    }
    result["license-header"] = switches["header"] || undefined;
    result["payload-flattening-threshold"] = parseInt(switches["ft"] || switches["payloadflatteningthreshold"] || "0");
    result["sync-methods"] = switches["syncmethods"] || undefined;
    result["add-credentials"] = switches["addcredentials"] === null || ((switches["addcredentials"] + "").toLowerCase() === "true");
    if (usedCodeGenerator === "ruby" || usedCodeGenerator === "python" || usedCodeGenerator === "go") {
        result["package-version"] = switches["pv"] || switches["packageversion"] || undefined;
        result["package-name"] = switches["pn"] || switches["packagename"] || undefined;
    }
    const outputFile = result["output-file"] = switches["outputfilename"] || undefined;
    if (outputFile && path_1.isAbsolute(outputFile)) {
        const splitAt = Math.max(outputFile.lastIndexOf("/"), outputFile.lastIndexOf("\\"));
        result["output-file"] = outputFile.slice(splitAt + 1);
        result["output-folder"] = outputFile.slice(0, splitAt);
    }
    result["message-format"] = switches["jsonvalidationmessages"] !== undefined ? "json" : undefined;
    if (codegenerator.toLowerCase() === "swaggerresolver") {
        result["output-artifact"] = "swagger-document";
        delete result[usedCodeGenerator];
    }
    return result;
}
exports.CreateConfiguration = CreateConfiguration;
//# sourceMappingURL=legacyCli.js.map