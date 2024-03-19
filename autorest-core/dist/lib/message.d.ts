import { EnhancedPosition, Position, Mappings, RawSourceMap } from "./ref/source-map";
import { Artifact } from "./artifact";
/**
 * The Channel that a message is registered with.
 */
export declare enum Channel {
    /** Information is considered the mildest of responses; not necesarily actionable. */
    Information,
    /** Warnings are considered important for best practices, but not catastrophic in nature. */
    Warning,
    /** Errors are considered blocking issues that block a successful operation.  */
    Error,
    /** Debug messages are designed for the developer to communicate internal autorest implementation details. */
    Debug,
    /** Verbose messages give the user additional clarity on the process. */
    Verbose,
    /** Catastrophic failure, likely abending the process.  */
    Fatal,
    /** Hint messages offer guidance or support without forcing action. */
    Hint,
    /** File represents a file output from an extension. Details are a Artifact and are required.  */
    File,
    /** content represents an update/creation of a configuration file. The final uri will be in the same folder as the primary config file. */
    Configuration
}
export interface SourceLocation {
    document: string;
    Position: EnhancedPosition;
}
export interface Range {
    document: string;
    start: Position;
    end: Position;
}
export interface Message {
    Channel: Channel;
    Key?: Iterable<string>;
    Details?: any;
    Text: string;
    Source?: Array<SourceLocation>;
    Range?: Iterable<Range>;
    Plugin?: string;
    FormattedMessage?: string;
}
export interface ArtifactMessage extends Message {
    Details: Artifact & {
        sourceMap?: Mappings | RawSourceMap;
    };
}
