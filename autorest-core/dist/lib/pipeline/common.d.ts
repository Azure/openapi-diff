import { ConfigurationView } from "../configuration";
import { DataHandle, DataSink, DataSource } from "../data-store/data-store";
export declare type PipelinePlugin = (config: ConfigurationView, input: DataSource, sink: DataSink) => Promise<DataSource>;
export declare function CreatePerFilePlugin(processorBuilder: (config: ConfigurationView) => Promise<(input: DataHandle, sink: DataSink) => Promise<DataHandle>>): PipelinePlugin;
