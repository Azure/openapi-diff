"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazyPromise = exports.Lazy = void 0;
class Lazy {
    constructor(factory) {
        this.factory = factory;
        this.promise = null;
    }
    get Value() {
        if (this.promise === null) {
            this.promise = { obj: this.factory() };
        }
        return this.promise.obj;
    }
}
exports.Lazy = Lazy;
class LazyPromise {
    constructor(factory) {
        this.factory = factory;
        this.promise = null;
    }
    get Value() {
        if (this.promise === null) {
            this.promise = this.factory();
        }
        return this.promise;
    }
    get hasValue() {
        return this.promise !== null;
    }
    then(onfulfilled, onrejected) {
        return this.Value.then(onfulfilled, onrejected);
    }
}
exports.LazyPromise = LazyPromise;
//# sourceMappingURL=lazy.js.map