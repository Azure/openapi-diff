"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delay = void 0;
function Delay(delayMS) {
    return new Promise(res => setTimeout(res, delayMS));
}
exports.Delay = Delay;
//# sourceMappingURL=sleep.js.map