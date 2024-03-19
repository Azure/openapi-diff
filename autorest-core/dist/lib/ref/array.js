"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushAll = void 0;
// since target.push(...source) is SO prone!
function pushAll(target, source) {
    for (const x of source) {
        target.push(x);
    }
}
exports.pushAll = pushAll;
//# sourceMappingURL=array.js.map