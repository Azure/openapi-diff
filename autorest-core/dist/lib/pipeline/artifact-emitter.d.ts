import { ConfigurationView } from "../configuration";
import { DataSource } from "../data-store/data-store";
export declare function EmitArtifacts(config: ConfigurationView, artifactTypeFilter: string | Array<string> | null, uriResolver: (key: string) => string, scope: DataSource, isObject: boolean): Promise<void>;
