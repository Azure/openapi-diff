export declare class OutstandingTaskAwaiter {
    private locked;
    private outstandingTasks;
    Wait(): Promise<void>;
    Await<T>(task: Promise<T>): Promise<T>;
}
