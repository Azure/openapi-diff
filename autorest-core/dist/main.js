"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
// load modules from static linker filesystem.
if (process.argv.indexOf("--no-static-loader") === -1 && process.env["no-static-loader"] === undefined) {
    require('./static-loader.js').load(`${__dirname}/static_modules.fs`);
}
var message_1 = require("./lib/message");
Object.defineProperty(exports, "Channel", { enumerable: true, get: function () { return message_1.Channel; } });
var autorest_core_1 = require("./lib/autorest-core");
Object.defineProperty(exports, "AutoRest", { enumerable: true, get: function () { return autorest_core_1.AutoRest; } });
Object.defineProperty(exports, "ConfigurationView", { enumerable: true, get: function () { return autorest_core_1.ConfigurationView; } });
Object.defineProperty(exports, "IdentifyDocument", { enumerable: true, get: function () { return autorest_core_1.IdentifyDocument; } });
Object.defineProperty(exports, "IsConfigurationExtension", { enumerable: true, get: function () { return autorest_core_1.IsConfigurationExtension; } });
Object.defineProperty(exports, "IsConfigurationDocument", { enumerable: true, get: function () { return autorest_core_1.IsConfigurationDocument; } });
Object.defineProperty(exports, "IsOpenApiExtension", { enumerable: true, get: function () { return autorest_core_1.IsOpenApiExtension; } });
Object.defineProperty(exports, "LiterateToJson", { enumerable: true, get: function () { return autorest_core_1.LiterateToJson; } });
Object.defineProperty(exports, "IsOpenApiDocument", { enumerable: true, get: function () { return autorest_core_1.IsOpenApiDocument; } });
var document_type_1 = require("./lib/document-type");
Object.defineProperty(exports, "DocumentFormat", { enumerable: true, get: function () { return document_type_1.DocumentFormat; } });
Object.defineProperty(exports, "DocumentExtension", { enumerable: true, get: function () { return document_type_1.DocumentExtension; } });
Object.defineProperty(exports, "DocumentPatterns", { enumerable: true, get: function () { return document_type_1.DocumentPatterns; } });
Object.defineProperty(exports, "DocumentType", { enumerable: true, get: function () { return document_type_1.DocumentType; } });
//# sourceMappingURL=main.js.map