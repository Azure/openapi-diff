"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertOAI2toOAI3 = void 0;
const oai2_to_oai3_1 = require("@microsoft.azure/oai2-to-oai3");
/* @internal */ async function ConvertOAI2toOAI3(input, sink) {
    const converter = new oai2_to_oai3_1.Oai2ToOai3(input.key, input.ReadObject());
    converter.convert();
    const generated = converter.generated;
    return sink.WriteObject('OpenAPI', generated, input.GetArtifact());
}
exports.ConvertOAI2toOAI3 = ConvertOAI2toOAI3;
//# sourceMappingURL=conversion.js.map