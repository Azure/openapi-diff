"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitter = exports.EventDispatcher = void 0;
const events = require("events");
class EventDispatcher {
    constructor(instance, name) {
        this._subscriptions = new Array();
        this._instance = instance;
        this._name = name;
    }
    UnsubscribeAll() {
        // call all the unsubscribes 
        for (let each of this._subscriptions) {
            each();
        }
        // and clear the subscriptions.
        this._subscriptions.length = 0;
    }
    Subscribe(fn) {
        if (fn) {
            this._instance.addListener(this._name, fn);
        }
        let unsub = () => { this.Unsubscribe(fn); };
        this._subscriptions.push(unsub);
        return unsub;
    }
    Unsubscribe(fn) {
        if (fn) {
            this._instance.removeListener(this._name, fn);
        }
    }
    Dispatch(args) {
        this._instance.emit(this._name, this._instance, args);
    }
}
exports.EventDispatcher = EventDispatcher;
class EventEmitter extends events.EventEmitter {
    constructor() {
        super();
        this._subscriptions = new Map();
        this._init(this);
    }
    static Event(target, propertyKey) {
        var init = target._init;
        target._init = (instance) => {
            let i = instance;
            // call previous init
            init.bind(instance)(instance);
            instance._subscriptions.set(propertyKey, new EventDispatcher(instance, propertyKey));
            var prop = {
                enumerable: true,
                get: () => {
                    return instance._subscriptions.get(propertyKey);
                }
            };
            Object.defineProperty(instance, propertyKey, prop);
        };
    }
    ;
    _init(t) {
    }
}
exports.EventEmitter = EventEmitter;
//# sourceMappingURL=events.js.map