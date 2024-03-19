"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsIterable = exports.Push = void 0;
/* @internal */ var linq_es2015_1 = require("linq-es2015");
Object.defineProperty(exports, "From", { enumerable: true, get: function () { return linq_es2015_1.From; } });
/* @internal */ function Push(destination, source) {
    if (source) {
        if (IsIterable(source)) {
            destination.push(...source);
        }
        else {
            destination.push(source);
        }
    }
}
exports.Push = Push;
/* @internal */ function IsIterable(target) {
    return target && target[Symbol.iterator] && typeof target !== "string";
}
exports.IsIterable = IsIterable;
//# sourceMappingURL=linq.js.map