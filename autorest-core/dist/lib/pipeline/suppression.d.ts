import { Message } from "../message";
import { ConfigurationView } from "../autorest-core";
export declare class Suppressor {
    private config;
    private suppressions;
    constructor(config: ConfigurationView);
    private MatchesSourceFilter;
    Filter(m: Message): Message | null;
}
