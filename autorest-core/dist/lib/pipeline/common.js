"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePerFilePlugin = void 0;
const data_store_1 = require("../data-store/data-store");
function CreatePerFilePlugin(processorBuilder) {
    return async (config, input, sink) => {
        const processor = await processorBuilder(config);
        const files = await input.Enum();
        const result = [];
        for (let file of files) {
            const fileIn = await input.ReadStrict(file);
            const fileOut = await processor(fileIn, sink);
            result.push(fileOut);
        }
        return new data_store_1.QuickDataSource(result);
    };
}
exports.CreatePerFilePlugin = CreatePerFilePlugin;
//# sourceMappingURL=common.js.map