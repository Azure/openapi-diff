"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPlugin_Help = void 0;
const data_store_1 = require("../data-store/data-store");
function GetPlugin_Help() {
    return async (config) => {
        const help = config.GetEntry("help-content");
        for (const helpKey of Object.keys(help).sort()) {
            config.GeneratedFile.Dispatch({
                type: "help",
                uri: `${helpKey}.json`,
                content: JSON.stringify(help[helpKey])
            });
        }
        return new data_store_1.QuickDataSource([]);
    };
}
exports.GetPlugin_Help = GetPlugin_Help;
//# sourceMappingURL=help.js.map