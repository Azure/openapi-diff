import { DataHandle, DataSink } from '../data-store/data-store';
import { ConfigurationView } from "../autorest-core";
export declare class Manipulator {
    private config;
    private transformations;
    private ctr;
    constructor(config: ConfigurationView);
    private MatchesSourceFilter;
    private ProcessInternal;
    Process(data: DataHandle, sink: DataSink, isObject: boolean, documentId?: string): Promise<DataHandle>;
}
