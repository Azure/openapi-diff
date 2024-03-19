"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFile = exports.readFile = exports.close = exports.readdir = exports.exists = exports.mkdir = void 0;
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const fs = require("fs");
function mkdir(path) {
    return new Promise((r, j) => fs.mkdir(path, (err) => err ? j(err) : r()));
}
exports.mkdir = mkdir;
exports.exists = path => new Promise((r, j) => fs.stat(path, (err, stats) => err ? r(false) : r(true)));
function readdir(path) {
    return new Promise((r, j) => fs.readdir(path, (err, files) => err ? j(err) : r(files)));
}
exports.readdir = readdir;
function close(fd) {
    return new Promise((r, j) => fs.close(fd, (err) => err ? j(err) : r()));
}
exports.close = close;
function readFile(path, options) {
    return new Promise((r, j) => fs.readFile(path, options, (err, data) => err ? j(err) : r(data)));
}
exports.readFile = readFile;
function writeFile(filename, content) {
    return new Promise((r, j) => fs.writeFile(filename, content, (err) => err ? j(err) : r()));
}
exports.writeFile = writeFile;
//# sourceMappingURL=async.js.map