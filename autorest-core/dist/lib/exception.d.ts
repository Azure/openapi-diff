export declare class Exception extends Error {
    exitCode: number;
    constructor(message: string, exitCode?: number);
}
export declare class OperationCanceledException extends Exception {
    exitCode: number;
    constructor(message?: string, exitCode?: number);
}
export declare class OutstandingTaskAlreadyCompletedException extends Exception {
    constructor();
}
export declare class OperationAbortedException extends Exception {
    constructor();
}
