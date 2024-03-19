"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutstandingTaskAwaiter = void 0;
const exception_1 = require("./exception");
class OutstandingTaskAwaiter {
    constructor() {
        this.locked = false;
        this.outstandingTasks = [];
    }
    async Wait() {
        this.locked = true;
        await Promise.all(this.outstandingTasks);
    }
    async Await(task) {
        if (this.locked) {
            throw new exception_1.OutstandingTaskAlreadyCompletedException();
        }
        this.outstandingTasks.push(task);
        return task;
    }
}
exports.OutstandingTaskAwaiter = OutstandingTaskAwaiter;
//# sourceMappingURL=outstanding-task-awaiter.js.map