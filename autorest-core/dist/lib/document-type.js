"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentPatterns = exports.DocumentExtension = exports.DocumentFormat = exports.DocumentType = void 0;
var DocumentType;
(function (DocumentType) {
    DocumentType[DocumentType["OpenAPI2"] = "OpenAPI2"] = "OpenAPI2";
    DocumentType[DocumentType["OpenAPI3"] = "OpenAPI3"] = "OpenAPI3";
    DocumentType[DocumentType["LiterateConfiguration"] = "LiterateConfiguration"] = "LiterateConfiguration";
    DocumentType[DocumentType["Unknown"] = "Unknown"] = "Unknown";
})(DocumentType = exports.DocumentType || (exports.DocumentType = {}));
var DocumentFormat;
(function (DocumentFormat) {
    DocumentFormat[DocumentFormat["Markdown"] = "markdown"] = "Markdown";
    DocumentFormat[DocumentFormat["Yaml"] = "yaml"] = "Yaml";
    DocumentFormat[DocumentFormat["Json"] = "json"] = "Json";
    DocumentFormat[DocumentFormat["Unknown"] = "unknown"] = "Unknown";
})(DocumentFormat = exports.DocumentFormat || (exports.DocumentFormat = {}));
exports.DocumentExtension = {
    "yaml": DocumentFormat.Yaml,
    "yml": DocumentFormat.Yaml,
    "json": DocumentFormat.Json,
    "md": DocumentFormat.Markdown,
    "markdown": DocumentFormat.Markdown
};
exports.DocumentPatterns = {
    yaml: [`*.${exports.DocumentExtension.yaml}`, `*.${exports.DocumentExtension.yml}`],
    json: [`*.${exports.DocumentExtension.json}`],
    markdown: [`*.${exports.DocumentExtension.markdown}`, `*.${exports.DocumentExtension.md}`],
    all: [""]
};
exports.DocumentPatterns.all = [...exports.DocumentPatterns.yaml, ...exports.DocumentPatterns.json, ...exports.DocumentPatterns.markdown];
//# sourceMappingURL=document-type.js.map