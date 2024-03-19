/// <reference types="node" />
import * as events from "events";
export interface IEvent<TSender extends events.EventEmitter, TArgs> {
    Subscribe(fn: (sender: TSender, args: TArgs) => void): () => void;
    Unsubscribe(fn: (sender: TSender, args: TArgs) => void): void;
    Dispatch(args: TArgs): void;
}
export declare class EventDispatcher<TSender extends EventEmitter, TArgs> implements IEvent<TSender, TArgs> {
    private _instance;
    private _name;
    private _subscriptions;
    constructor(instance: TSender, name: string);
    UnsubscribeAll(): void;
    Subscribe(fn: (sender: TSender, args: TArgs) => void): () => void;
    Unsubscribe(fn: (sender: TSender, args: TArgs) => void): void;
    Dispatch(args: TArgs): void;
}
export declare class EventEmitter extends events.EventEmitter {
    private _subscriptions;
    constructor();
    protected static Event<TSender extends EventEmitter, TArgs>(target: TSender, propertyKey: string): void;
    protected _init(t: EventEmitter): void;
}
