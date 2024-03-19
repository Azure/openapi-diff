"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataHandle = exports.DataSink = exports.DataStore = exports.QuickDataSource = exports.DataSource = void 0;
const text_utility_1 = require("../parsing/text-utility");
const cancellation_1 = require("../ref/cancellation");
const uri_1 = require("../ref/uri");
const yaml_1 = require("../ref/yaml");
const source_map_1 = require("source-map");
const source_map_2 = require("../source-map/source-map");
const blaming_1 = require("../source-map/blaming");
const lazy_1 = require("../lazy");
const exception_1 = require("../exception");
const FALLBACK_DEFAULT_OUTPUT_ARTIFACT = "";
/********************************************
 * Central data controller
 * - one stop for creating data
 * - ensures WRITE ONCE model
 ********************************************/
class DataSource {
    async ReadStrict(uri) {
        const result = await this.Read(uri);
        if (result === null) {
            throw new Error(`Could not read '${uri}'.`);
        }
        return result;
    }
    async Dump(targetDirUri) {
        targetDirUri = uri_1.EnsureIsFolderUri(targetDirUri);
        const keys = await this.Enum();
        for (const key of keys) {
            const dataHandle = await this.ReadStrict(key);
            const data = dataHandle.ReadData();
            const metadata = dataHandle.ReadMetadata();
            const targetFileUri = uri_1.ResolveUri(targetDirUri, key.replace(":", "")); // make key (URI) a descriptive relative path
            await uri_1.WriteString(targetFileUri, data);
            await uri_1.WriteString(targetFileUri + ".map", JSON.stringify(metadata.sourceMap.Value, null, 2));
            await uri_1.WriteString(targetFileUri + ".input.map", JSON.stringify(metadata.inputSourceMap.Value, null, 2));
        }
    }
}
exports.DataSource = DataSource;
class QuickDataSource extends DataSource {
    constructor(handles) {
        super();
        this.handles = handles;
    }
    async Enum() {
        return this.handles.map(x => x.key);
    }
    async Read(key) {
        const data = this.handles.filter(x => x.key === key)[0];
        return data || null;
    }
}
exports.QuickDataSource = QuickDataSource;
class ReadThroughDataSource extends DataSource {
    constructor(store, fs) {
        super();
        this.store = store;
        this.fs = fs;
        this.uris = [];
        this.cache = {};
    }
    async Read(uri) {
        uri = uri_1.ToRawDataUrl(uri); // makes sure logical paths (like for source maps) also reference the URLs of the actual data
        // sync cache (inner stuff is racey!)
        if (!this.cache[uri]) {
            this.cache[uri] = (async () => {
                // probe data store
                try {
                    const existingData = await this.store.Read(uri);
                    this.uris.push(uri);
                    return existingData;
                }
                catch (e) {
                }
                // populate cache
                let data = null;
                try {
                    data = await this.fs.ReadFile(uri) || await uri_1.ReadUri(uri);
                }
                finally {
                    if (!data) {
                        return null;
                    }
                }
                const readHandle = await this.store.WriteData(uri, data, "input-file");
                this.uris.push(uri);
                return readHandle;
            })();
        }
        return await this.cache[uri];
    }
    async Enum() {
        return this.uris;
    }
}
class DataStore {
    constructor(cancellationToken = cancellation_1.CancellationToken.None) {
        this.cancellationToken = cancellationToken;
        this.BaseUri = DataStore.BaseUri;
        this.store = {};
        /****************
         * Data access
         ***************/
        this.uid = 0;
    }
    ThrowIfCancelled() {
        if (this.cancellationToken.isCancellationRequested) {
            throw new exception_1.OperationCanceledException();
        }
    }
    GetReadThroughScope(fs) {
        return new ReadThroughDataSource(this, fs);
    }
    async WriteDataInternal(uri, data, metadata) {
        this.ThrowIfCancelled();
        if (this.store[uri]) {
            throw new Error(`can only write '${uri}' once`);
        }
        this.store[uri] = {
            data: data,
            metadata: metadata
        };
        return this.Read(uri);
    }
    async WriteData(description, data, artifact, sourceMapFactory) {
        const uri = this.createUri(description);
        // metadata
        const metadata = {};
        const result = await this.WriteDataInternal(uri, data, metadata);
        metadata.artifact = artifact;
        metadata.sourceMap = new lazy_1.Lazy(() => {
            if (!sourceMapFactory) {
                return new source_map_1.SourceMapGenerator().toJSON();
            }
            const sourceMap = sourceMapFactory(result);
            // validate
            const inputFiles = sourceMap.sources.concat(sourceMap.file);
            for (const inputFile of inputFiles) {
                if (!this.store[inputFile]) {
                    throw new Error(`Source map of '${uri}' references '${inputFile}' which does not exist`);
                }
            }
            return sourceMap;
        });
        metadata.sourceMapEachMappingByLine = new lazy_1.Lazy(() => {
            const result = [];
            const sourceMapConsumer = new source_map_1.SourceMapConsumer(metadata.sourceMap.Value);
            // const singleResult = sourceMapConsumer.originalPositionFor(position);
            // does NOT support multiple sources :(
            // `singleResult` has null-properties if there is no original
            // get coinciding sources
            sourceMapConsumer.eachMapping(mapping => {
                while (result.length <= mapping.generatedLine) {
                    result.push([]);
                }
                result[mapping.generatedLine].push(mapping);
            });
            return result;
        });
        metadata.inputSourceMap = new lazy_1.Lazy(() => this.CreateInputSourceMapFor(uri));
        metadata.yamlAst = new lazy_1.Lazy(() => yaml_1.ParseToAst(data));
        metadata.lineIndices = new lazy_1.Lazy(() => text_utility_1.LineIndices(data));
        return result;
    }
    createUri(description) {
        return uri_1.ResolveUri(this.BaseUri, `${this.uid++}?${encodeURIComponent(description)}`);
    }
    getDataSink(defaultArtifact = FALLBACK_DEFAULT_OUTPUT_ARTIFACT) {
        return new DataSink((description, data, artifact, sourceMapFactory) => this.WriteData(description, data, artifact || defaultArtifact, sourceMapFactory), async (description, input) => {
            const uri = this.createUri(description);
            this.store[uri] = this.store[input.key];
            return this.Read(uri);
        });
    }
    ReadStrictSync(absoluteUri) {
        const entry = this.store[absoluteUri];
        if (entry === undefined) {
            throw new Error(`Object '${absoluteUri}' does not exist.`);
        }
        return new DataHandle(absoluteUri, entry);
    }
    async Read(uri) {
        uri = uri_1.ResolveUri(this.BaseUri, uri);
        const data = this.store[uri];
        if (!data) {
            throw new Error(`Could not read '${uri}'.`);
        }
        return new DataHandle(uri, data);
    }
    Blame(absoluteUri, position) {
        const data = this.ReadStrictSync(absoluteUri);
        const resolvedPosition = source_map_2.CompilePosition(position, data);
        return blaming_1.BlameTree.Create(this, {
            source: absoluteUri,
            column: resolvedPosition.column,
            line: resolvedPosition.line,
            name: `blameRoot (${JSON.stringify(position)})`
        });
    }
    CreateInputSourceMapFor(absoluteUri) {
        const data = this.ReadStrictSync(absoluteUri);
        // retrieve all target positions
        const targetPositions = [];
        const metadata = data.ReadMetadata();
        const sourceMapConsumer = new source_map_1.SourceMapConsumer(metadata.sourceMap.Value);
        sourceMapConsumer.eachMapping(m => targetPositions.push({ column: m.generatedColumn, line: m.generatedLine }));
        // collect blame
        const mappings = [];
        for (const targetPosition of targetPositions) {
            const blameTree = this.Blame(absoluteUri, targetPosition);
            const inputPositions = blameTree.BlameLeafs();
            for (const inputPosition of inputPositions) {
                mappings.push({
                    name: inputPosition.name,
                    source: this.ReadStrictSync(inputPosition.source).Description,
                    generated: blameTree.node,
                    original: inputPosition
                });
            }
        }
        const sourceMapGenerator = new source_map_1.SourceMapGenerator({ file: absoluteUri });
        source_map_2.Compile(mappings, sourceMapGenerator);
        return sourceMapGenerator.toJSON();
    }
}
exports.DataStore = DataStore;
DataStore.BaseUri = "mem://";
/********************************************
 * Data handles
 * - provide well-defined access to specific data
 * - provide convenience methods
 ********************************************/
class DataSink {
    constructor(write, forward) {
        this.write = write;
        this.forward = forward;
    }
    async WriteDataWithSourceMap(description, data, artifact, sourceMapFactory) {
        return await this.write(description, data, artifact, sourceMapFactory);
    }
    async WriteData(description, data, artifact, mappings = [], mappingSources = []) {
        return await this.WriteDataWithSourceMap(description, data, artifact, readHandle => {
            const sourceMapGenerator = new source_map_1.SourceMapGenerator({ file: readHandle.key });
            source_map_2.Compile(mappings, sourceMapGenerator, mappingSources.concat(readHandle));
            return sourceMapGenerator.toJSON();
        });
    }
    WriteObject(description, obj, artifact, mappings = [], mappingSources = []) {
        return this.WriteData(description, yaml_1.FastStringify(obj), artifact, mappings, mappingSources);
    }
    Forward(description, input) {
        return this.forward(description, input);
    }
}
exports.DataSink = DataSink;
class DataHandle {
    constructor(key, read) {
        this.key = key;
        this.read = read;
    }
    ReadData() {
        return this.read.data;
    }
    ReadMetadata() {
        return this.read.metadata;
    }
    ReadObject() {
        return yaml_1.ParseNode(this.ReadYamlAst());
    }
    ReadYamlAst() {
        return this.ReadMetadata().yamlAst.Value;
    }
    GetArtifact() {
        return this.ReadMetadata().artifact;
    }
    get Description() {
        return decodeURIComponent(this.key.split('?').reverse()[0]);
    }
    IsObject() {
        try {
            this.ReadObject();
            return true;
        }
        catch (e) {
            return false;
        }
    }
    Blame(position) {
        const metadata = this.ReadMetadata();
        const sameLineResults = (metadata.sourceMapEachMappingByLine.Value[position.line] || [])
            .filter(mapping => mapping.generatedColumn <= position.column);
        const maxColumn = sameLineResults.reduce((c, m) => Math.max(c, m.generatedColumn), 0);
        const columnDelta = position.column - maxColumn;
        return sameLineResults.filter(m => m.generatedColumn === maxColumn).map(m => {
            return {
                column: m.originalColumn + columnDelta,
                line: m.originalLine,
                name: m.name,
                source: m.source
            };
        });
    }
}
exports.DataHandle = DataHandle;
//# sourceMappingURL=data-store.js.map