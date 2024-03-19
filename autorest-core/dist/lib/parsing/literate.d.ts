import * as commonmark from '../ref/commonmark';
import { DataHandle, DataSink } from '../data-store/data-store';
export declare function Parse(hConfigFile: DataHandle, sink: DataSink): Promise<{
    data: DataHandle;
    codeBlock: commonmark.Node;
}[]>;
export declare function ParseCommonmark(markdown: string): commonmark.Node;
export declare function CommonmarkSubHeadings(startNode: commonmark.Node | null): Iterable<commonmark.Node>;
export declare function CommonmarkHeadingText(headingNode: commonmark.Node): string;
export declare function CommonmarkHeadingFollowingText(headingNode: commonmark.Node): [number, number];
