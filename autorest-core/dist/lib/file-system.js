"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedFileSystem = exports.RealFileSystem = exports.MemoryFileSystem = void 0;
const uri_1 = require("./ref/uri");
const linq_1 = require("./ref/linq");
const Constants = require("./constants");
class MemoryFileSystem {
    constructor(files) {
        this.Outputs = new Map();
        this.filesByUri = new Map(linq_1.From(files.entries()).Select(entry => [
            uri_1.ResolveUri(MemoryFileSystem.DefaultVirtualRootUri, entry[0]),
            entry[1]
        ]));
    }
    async ReadFile(uri) {
        if (!this.filesByUri.has(uri)) {
            throw new Error(`File ${uri} is not in the MemoryFileSystem`);
        }
        return this.filesByUri.get(uri);
    }
    async EnumerateFileUris(folderUri = MemoryFileSystem.DefaultVirtualRootUri) {
        return await [...linq_1.From(this.filesByUri.keys()).Where(uri => {
                // in folder?
                if (!uri.startsWith(folderUri)) {
                    return false;
                }
                // not in subfolder?
                return uri.substr(folderUri.length).indexOf("/") === -1;
            })];
    }
    async WriteFile(uri, content) {
        this.Outputs.set(uri, content);
    }
}
exports.MemoryFileSystem = MemoryFileSystem;
MemoryFileSystem.DefaultVirtualRootUri = "file:///";
class RealFileSystem {
    constructor() {
    }
    EnumerateFileUris(folderUri) {
        return uri_1.EnumerateFiles(folderUri, [
            Constants.DefaultConfiguration
        ]);
    }
    async ReadFile(uri) {
        return uri_1.ReadUri(uri);
    }
    async WriteFile(uri, content) {
        return uri_1.WriteString(uri, content);
    }
}
exports.RealFileSystem = RealFileSystem;
// handles:
// - GitHub URI adjustment
// - GitHub auth
class EnhancedFileSystem {
    constructor(githubAuthToken) {
        this.githubAuthToken = githubAuthToken;
    }
    EnumerateFileUris(folderUri) {
        return uri_1.EnumerateFiles(folderUri, [
            Constants.DefaultConfiguration
        ]);
    }
    async ReadFile(uri) {
        uri = uri_1.ToRawDataUrl(uri);
        const headers = {};
        // check for GitHub OAuth token
        if (this.githubAuthToken && uri.startsWith("https://raw.githubusercontent.com")) {
            console.log(`Used GitHub authentication token to request '${uri}'.`);
            headers.authorization = `Bearer ${this.githubAuthToken}`;
        }
        return uri_1.ReadUri(uri, headers);
    }
    async WriteFile(uri, content) {
        return uri_1.WriteString(uri, content);
    }
}
exports.EnhancedFileSystem = EnhancedFileSystem;
//# sourceMappingURL=file-system.js.map