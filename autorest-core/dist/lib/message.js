"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
/**
 * The Channel that a message is registered with.
 */
var Channel;
(function (Channel) {
    /** Information is considered the mildest of responses; not necesarily actionable. */
    Channel[Channel["Information"] = "information"] = "Information";
    /** Warnings are considered important for best practices, but not catastrophic in nature. */
    Channel[Channel["Warning"] = "warning"] = "Warning";
    /** Errors are considered blocking issues that block a successful operation.  */
    Channel[Channel["Error"] = "error"] = "Error";
    /** Debug messages are designed for the developer to communicate internal autorest implementation details. */
    Channel[Channel["Debug"] = "debug"] = "Debug";
    /** Verbose messages give the user additional clarity on the process. */
    Channel[Channel["Verbose"] = "verbose"] = "Verbose";
    /** Catastrophic failure, likely abending the process.  */
    Channel[Channel["Fatal"] = "fatal"] = "Fatal";
    /** Hint messages offer guidance or support without forcing action. */
    Channel[Channel["Hint"] = "hint"] = "Hint";
    /** File represents a file output from an extension. Details are a Artifact and are required.  */
    Channel[Channel["File"] = "file"] = "File";
    /** content represents an update/creation of a configuration file. The final uri will be in the same folder as the primary config file. */
    Channel[Channel["Configuration"] = "configuration"] = "Configuration";
})(Channel = exports.Channel || (exports.Channel = {}));
;
//# sourceMappingURL=message.js.map