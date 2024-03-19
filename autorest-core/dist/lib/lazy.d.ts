export declare class Lazy<T> {
    private factory;
    private promise;
    constructor(factory: () => T);
    get Value(): T;
}
export declare class LazyPromise<T> implements PromiseLike<T> {
    private factory;
    private promise;
    constructor(factory: () => Promise<T>);
    private get Value();
    get hasValue(): boolean;
    then<TResult1, TResult2>(onfulfilled: (value: T) => TResult1 | PromiseLike<TResult1>, onrejected: (reason: any) => TResult2 | PromiseLike<TResult2>): PromiseLike<TResult1 | TResult2>;
}
