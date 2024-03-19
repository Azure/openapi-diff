"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationAbortedException = exports.OutstandingTaskAlreadyCompletedException = exports.OperationCanceledException = exports.Exception = void 0;
class Exception extends Error {
    constructor(message, exitCode = 1) {
        super(message.includes('[') ? message : `[Exception] ${message}`);
        this.exitCode = exitCode;
        Object.setPrototypeOf(this, Exception.prototype);
    }
}
exports.Exception = Exception;
class OperationCanceledException extends Exception {
    constructor(message = "Cancelation Requested", exitCode = 1) {
        super(`[OperationCanceledException] ${message}`, exitCode);
        this.exitCode = exitCode;
        Object.setPrototypeOf(this, OperationCanceledException.prototype);
    }
}
exports.OperationCanceledException = OperationCanceledException;
class OutstandingTaskAlreadyCompletedException extends Exception {
    constructor() {
        super("[OutstandingTaskAlreadyCompletedException] The OutstandingTaskAwaiter is already completed, may not Enter() again.", 1);
        Object.setPrototypeOf(this, OutstandingTaskAlreadyCompletedException.prototype);
    }
}
exports.OutstandingTaskAlreadyCompletedException = OutstandingTaskAlreadyCompletedException;
class OperationAbortedException extends Exception {
    constructor() {
        super("[OperationAbortedException] Error occurred. Exiting.", 1);
        Object.setPrototypeOf(this, OperationAbortedException.prototype);
    }
}
exports.OperationAbortedException = OperationAbortedException;
//# sourceMappingURL=exception.js.map