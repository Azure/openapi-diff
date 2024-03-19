import { ConfigurationView } from "../autorest-core";
import { DataHandle, DataSink, DataSource } from '../data-store/data-store';
export declare function LoadLiterateSwaggerOverride(config: ConfigurationView, inputScope: DataSource, inputFileUri: string, sink: DataSink): Promise<DataHandle>;
export declare function LoadLiterateSwagger(config: ConfigurationView, inputScope: DataSource, inputFileUri: string, sink: DataSink): Promise<DataHandle>;
export declare function LoadLiterateSwaggers(config: ConfigurationView, inputScope: DataSource, inputFileUris: string[], sink: DataSink): Promise<DataHandle[]>;
export declare function LoadLiterateSwaggerOverrides(config: ConfigurationView, inputScope: DataSource, inputFileUris: string[], sink: DataSink): Promise<DataHandle[]>;
export declare function ComposeSwaggers(config: ConfigurationView, overrideInfoTitle: any, overrideInfoDescription: any, inputSwaggers: DataHandle[], sink: DataSink): Promise<DataHandle>;
