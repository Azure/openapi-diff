"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExtension = exports.FileUriToPath = exports.ClearFolder = exports.WriteString = exports.EnumerateFiles = exports.MakeRelativeUri = exports.ParentFolderUri = exports.ResolveUri = exports.ToRawDataUrl = exports.GetFilenameWithoutExtension = exports.GetFilename = exports.EnsureIsFileUri = exports.EnsureIsFolderUri = exports.CreateFolderUri = exports.CreateFileUri = exports.CreateFileOrFolderUri = exports.ExistsUri = exports.ReadUri = exports.IsUri = void 0;
function IsUri(uri) {
    return /^([a-z0-9+.-]+):(?:\/\/(?:((?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*)@)?((?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*)(?::(\d*))?(\/(?:[a-z0-9-._~!$&'()*+,;=:@/]|%[0-9A-F]{2})*)?|(\/?(?:[a-z0-9-._~!$&'()*+,;=:@]|%[0-9A-F]{2})+(?:[a-z0-9-._~!$&'()*+,;=:@/]|%[0-9A-F]{2})*)?)(?:\?((?:[a-z0-9-._~!$&'()*+,;=:/?@]|%[0-9A-F]{2})*))?(?:#((?:[a-z0-9-._~!$&'()*+,;=:/?@]|%[0-9A-F]{2})*))?$/i.test(uri);
}
exports.IsUri = IsUri;
const url_1 = require("url");
const path_1 = require("path");
const stripBom = require("strip-bom");
const getUri = require("get-uri");
function getUriAsync(uri, options) {
    return new Promise((r, j) => getUri(uri, options, (err, rs) => err ? j(err) : r(rs)));
}
/**
 * Loads a UTF8 string from given URI.
 */
async function ReadUri(uri, headers = {}) {
    try {
        const readable = await getUriAsync(uri, { headers: headers });
        const readAll = new Promise(function (resolve, reject) {
            let result = "";
            readable.on("data", data => result += data.toString());
            readable.on("end", () => resolve(result));
            readable.on("error", err => reject(err));
        });
        let result = await readAll;
        // fix up UTF16le files
        if (result.charCodeAt(0) === 65533 && result.charCodeAt(1) === 65533) {
            result = Buffer.from(result.slice(2)).toString("utf16le");
        }
        return stripBom(result);
    }
    catch (e) {
        throw new Error(`Failed to load '${uri}' (${e})`);
    }
}
exports.ReadUri = ReadUri;
async function ExistsUri(uri) {
    try {
        await ReadUri(uri);
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.ExistsUri = ExistsUri;
/***********************
 * URI manipulation
 ***********************/
const path_2 = require("path");
const URI = require("urijs");
const fileUri = require("file-url");
/**
 *  remake of path.isAbsolute... because it's platform dependent:
 * Windows: C:\\... -> true    /... -> true
 * Linux:   C:\\... -> false   /... -> true
 */
function isAbsolute(path) {
    return !!path.match(/^([a-zA-Z]:)?(\/|\\)/);
}
/**
 * determines what an absolute URI is for our purposes, consider:
 * - we had Ruby try to use "Azure::ARM::SQL" as a file name, so that should not be considered absolute
 * - we want simple, easily predictable semantics
 */
function isUriAbsolute(url) {
    return /^[a-z]+:\/\//.test(url);
}
/**
 * Create a 'file:///' URI from given absolute path.
 * Examples:
 * - "C:\swagger\storage.yaml" -> "file:///C:/swagger/storage.yaml"
 * - "/input/swagger.yaml" -> "file:///input/swagger.yaml"
 */
function CreateFileOrFolderUri(absolutePath) {
    if (!isAbsolute(absolutePath)) {
        throw new Error(`Can only create file URIs from absolute paths. Got '${absolutePath}'`);
    }
    let result = fileUri(absolutePath, { resolve: false });
    // handle UNCs
    if (absolutePath.startsWith("//") || absolutePath.startsWith("\\\\")) {
        result = result.replace(/^file:\/\/\/\//, "file://");
    }
    return result;
}
exports.CreateFileOrFolderUri = CreateFileOrFolderUri;
function CreateFileUri(absolutePath) {
    return EnsureIsFileUri(CreateFileOrFolderUri(absolutePath));
}
exports.CreateFileUri = CreateFileUri;
function CreateFolderUri(absolutePath) {
    return EnsureIsFolderUri(CreateFileOrFolderUri(absolutePath));
}
exports.CreateFolderUri = CreateFolderUri;
function EnsureIsFolderUri(uri) {
    return EnsureIsFileUri(uri) + "/";
}
exports.EnsureIsFolderUri = EnsureIsFolderUri;
function EnsureIsFileUri(uri) {
    return uri.replace(/\/$/g, "");
}
exports.EnsureIsFileUri = EnsureIsFileUri;
function GetFilename(uri) {
    return uri.split("/").reverse()[0].split("\\").reverse()[0];
}
exports.GetFilename = GetFilename;
function GetFilenameWithoutExtension(uri) {
    const lastPart = GetFilename(uri);
    const ext = lastPart.indexOf(".") === -1 ? "" : lastPart.split(".").reverse()[0];
    return lastPart.substr(0, lastPart.length - ext.length - 1);
}
exports.GetFilenameWithoutExtension = GetFilenameWithoutExtension;
function ToRawDataUrl(uri) {
    // special URI handlers (the 'if's shouldn't be necessary but provide some additional isolation in case there is anything wrong with one of the regexes)
    // - GitHub repo
    if (uri.startsWith("https://github.com")) {
        uri = uri.replace(/^https?:\/\/(github.com)(\/[^\/]+\/[^\/]+\/)(blob|tree)\/(.*)$/ig, "https://raw.githubusercontent.com$2$4");
    }
    // - GitHub gist
    if (uri.startsWith("gist://")) {
        uri = uri.replace(/^gist:\/\/([^\/]+\/[^\/]+)$/ig, "https://gist.githubusercontent.com/$1/raw/");
    }
    if (uri.startsWith("https://gist.github.com")) {
        uri = uri.replace(/^https?:\/\/gist.github.com\/([^\/]+\/[^\/]+)$/ig, "https://gist.githubusercontent.com/$1/raw/");
    }
    return uri;
}
exports.ToRawDataUrl = ToRawDataUrl;
/**
 * The singularity of all resolving.
 * With URI as our one data type of truth, this method maps an absolute or relative path or URI to a URI using given base URI.
 * @param baseUri   Absolute base URI
 * @param pathOrUri Relative/absolute path/URI
 * @returns Absolute URI
 */
function ResolveUri(baseUri, pathOrUri) {
    if (isAbsolute(pathOrUri)) {
        return CreateFileOrFolderUri(pathOrUri);
    }
    // known here: `pathOrUri` is eiher URI (relative or absolute) or relative path - which we can normalize to a relative URI
    pathOrUri = pathOrUri.replace(/\\/g, "/");
    // known here: `pathOrUri` is a URI (relative or absolute)
    if (isUriAbsolute(pathOrUri)) {
        return pathOrUri;
    }
    // known here: `pathOrUri` is a relative URI
    if (!baseUri) {
        throw new Error("'pathOrUri' was detected to be relative so 'baseUri' is required");
    }
    try {
        const base = new URI(baseUri);
        const relative = new URI(pathOrUri);
        if (baseUri.startsWith("untitled:///") && pathOrUri.startsWith("untitled:")) {
            return pathOrUri;
        }
        const result = relative.absoluteTo(base);
        // GitHub simple token forwarding, for when you pass a URI to a private repo file with `?token=` query parameter.
        // this may be easier for quick testing than getting and passing an OAuth token.  
        if (base.protocol() === "https" && base.hostname() === "raw.githubusercontent.com" &&
            result.protocol() === "https" && result.hostname() === "raw.githubusercontent.com") {
            result.query(base.query());
        }
        return result.toString();
    }
    catch (e) {
        throw new Error(`Failed resolving '${pathOrUri}' against '${baseUri}'.`);
    }
}
exports.ResolveUri = ResolveUri;
function ParentFolderUri(uri) {
    // root?
    if (uri.endsWith("//")) {
        return null;
    }
    // folder? => cut away last "/"
    if (uri.endsWith("/")) {
        uri = uri.slice(0, uri.length - 1);
    }
    // cut away last component
    const compLen = uri.split("/").reverse()[0].length;
    return uri.slice(0, uri.length - compLen);
}
exports.ParentFolderUri = ParentFolderUri;
function MakeRelativeUri(baseUri, absoluteUri) {
    return new URI(absoluteUri).relativeTo(baseUri).toString();
}
exports.MakeRelativeUri = MakeRelativeUri;
/***********************
 * OS abstraction (writing files, enumerating files)
 ***********************/
const async_1 = require("./async");
const fs_1 = require("fs");
function isAccessibleFile(localPath) {
    try {
        return fs_1.lstatSync(localPath).isFile();
    }
    catch (e) {
        return false;
    }
}
function FileUriToLocalPath(fileUri) {
    const uri = url_1.parse(fileUri);
    if (!fileUri.startsWith("file:///")) {
        throw new Error(`Cannot write data to '${fileUri}'. ` + (!fileUri.startsWith("file://")
            ? `Protocol '${uri.protocol}' not supported for writing.`
            : `UNC paths not supported for writing.`) + " Make sure to specify a local, absolute path as target file/folder.");
    }
    // convert to path
    let p = uri.path;
    if (p === undefined) {
        throw new Error(`Cannot write to '${uri}'. Path not found.`);
    }
    if (path_1.sep === "\\") {
        if (p.indexOf(':') > 0) {
            p = p.substr(p.startsWith("/") ? 1 : 0);
        }
        p = p.replace(/\//g, "\\");
    }
    return decodeURI(p);
}
async function EnumerateFiles(folderUri, probeFiles = []) {
    const results = new Array();
    folderUri = EnsureIsFolderUri(folderUri);
    if (folderUri.startsWith("file:")) {
        let files = [];
        try {
            files = await async_1.readdir(FileUriToLocalPath(folderUri));
        }
        catch (e) { }
        results.push(...files
            .map(f => ResolveUri(folderUri, f))
            .filter(f => isAccessibleFile(FileUriToLocalPath(f))));
    }
    else {
        for (const candid of probeFiles.map(f => ResolveUri(folderUri, f))) {
            if (await ExistsUri(candid)) {
                results.push(candid);
            }
        }
    }
    return results;
}
exports.EnumerateFiles = EnumerateFiles;
async function CreateDirectoryFor(filePath) {
    var dir = path_2.dirname(filePath);
    if (!await async_1.exists(dir)) {
        await CreateDirectoryFor(dir);
        try {
            await async_1.mkdir(dir);
        }
        catch (e) {
            // mkdir throws if directory already exists - which happens occasionally due to race conditions
        }
    }
}
async function WriteStringInternal(fileName, data) {
    await CreateDirectoryFor(fileName);
    await async_1.writeFile(fileName, data);
}
/**
 * Writes string to local file system.
 * @param fileUri  Target file uri.
 * @param data     String to write (encoding: UTF8).
 */
function WriteString(fileUri, data) {
    return WriteStringInternal(FileUriToLocalPath(fileUri), data);
}
exports.WriteString = WriteString;
/**
 * Clears a folder on the local file system.
 * @param folderUri  Folder uri.
 */
const async_io_1 = require("@microsoft.azure/async-io");
async function ClearFolder(folderUri) {
    return await async_io_1.rmdir(FileUriToLocalPath(folderUri));
}
exports.ClearFolder = ClearFolder;
function FileUriToPath(fileUri) {
    const uri = url_1.parse(fileUri);
    if (uri.protocol !== "file:") {
        throw `Protocol '${uri.protocol}' not supported for writing.`;
    }
    // convert to path
    let p = uri.path;
    if (p === undefined) {
        throw `Cannot write to '${uri}'. Path not found.`;
    }
    if (path_1.sep === "\\") {
        p = p.substr(p.startsWith("/") ? 1 : 0);
        p = p.replace(/\//g, "\\");
    }
    return p;
}
exports.FileUriToPath = FileUriToPath;
function GetExtension(name) {
    let ext = path_1.extname(name);
    if (ext) {
        return ext.substr(1).toLowerCase();
    }
    return ext;
}
exports.GetExtension = GetExtension;
//# sourceMappingURL=uri.js.map