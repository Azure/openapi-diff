"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPlugin_SchemaValidator = void 0;
const SchemaValidator = require("z-schema");
const jsonpath_1 = require("../ref/jsonpath");
const common_1 = require("./common");
const message_1 = require("../message");
const exception_1 = require("../exception");
function GetPlugin_SchemaValidator() {
    const validator = new SchemaValidator({ breakOnFirstError: false });
    const extendedSwaggerSchema = require("./swagger-extensions.json");
    validator.setRemoteReference("http://json.schemastore.org/swagger-2.0", require("./swagger.json"));
    validator.setRemoteReference("https://raw.githubusercontent.com/Azure/autorest/master/schema/example-schema.json", require("./example-schema.json"));
    return common_1.CreatePerFilePlugin(async (config) => async (fileIn, sink) => {
        const obj = fileIn.ReadObject();
        const errors = await new Promise(res => validator.validate(obj, extendedSwaggerSchema, (err, valid) => res(valid ? null : err)));
        if (errors !== null) {
            for (const error of errors) {
                config.Message({
                    Channel: message_1.Channel.Error,
                    Details: error,
                    Plugin: "schema-validator",
                    Source: [{ document: fileIn.key, Position: { path: jsonpath_1.parseJsonPointer(error.path) } }],
                    Text: `Schema violation: ${error.message}`
                });
            }
            throw new exception_1.OperationAbortedException();
        }
        return await sink.Forward(fileIn.Description, fileIn);
    });
}
exports.GetPlugin_SchemaValidator = GetPlugin_SchemaValidator;
//# sourceMappingURL=schema-validation.js.map