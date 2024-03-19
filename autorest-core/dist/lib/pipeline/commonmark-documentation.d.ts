import { Node } from "../ref/commonmark";
import { DataHandle, DataSink } from '../data-store/data-store';
export declare function PlainTextVersion(commonmarkAst: Node): string;
export declare function ProcessCodeModel(codeModel: DataHandle, sink: DataSink): Promise<DataHandle>;
