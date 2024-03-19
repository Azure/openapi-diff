"use strict";
// ---------------------------------------------------------------------------------------------
//  Copyright (c) Microsoft Corporation. All rights reserved.
//  Licensed under the MIT License. See License.txt in the project root for license information.
// ---------------------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentAnalysis = void 0;
const jsonpath_1 = require("../lib/ref/jsonpath");
const jsonpath_2 = require("jsonpath");
/**
 * @internal
 * This class provides complex analysis for a document in relation to its peers, i.e.
 * the other documents involved in one AutoRest/validation run (configuration file, OpenAPI documents).
 * As such, it offers operations like:
 * - looking up JSON paths/queries among all OpenAPI documents,
 * - retrieving the data (and corresponding JSON path) that can be found at a certain text location.
 *
 * Essentially, it provides useful mappings between logical (JSON path) and physical (line/column) locations in both directions.
 */
class DocumentAnalysis {
    constructor(documentUri, document, fullyResolvedAndMergedDefinition, fullyResolvedAndMergedDefinitionMap) {
        this.documentUri = documentUri;
        this.document = document;
        this.fullyResolvedAndMergedDefinition = fullyResolvedAndMergedDefinition;
        this.fullyResolvedAndMergedDefinitionMap = fullyResolvedAndMergedDefinitionMap;
    }
    /**
     * Determines the JSON query found at a given position.
     * For example, suppressions will use JSON queries to limit the scope of the suppression (e.g. `$..parameters[?(@.name === 'quirkyParam')]`).
     *
     * @param position The position to look at for a JSON query.
     */
    GetJsonQueryAt(position) {
        const lines = this.document.split("\n");
        const potentialQuery = (lines[position.line].match(/\B\$[.[].+/g) || [])[0];
        try {
            jsonpath_2.parse(potentialQuery);
        }
        catch (e) {
            return null;
        }
        return potentialQuery;
    }
    /**
     * Determines the JSON path equivalent to the JSON reference at a given position.
     * OpenAPI definitions make use of these excessively.
     *
     * @param position The position to look at for a JSON reference.
     */
    GetJsonPathFromJsonReferenceAt(position) {
        const fullyResolvedAndMergedDefinitionLocation = this.fullyResolvedAndMergedDefinitionMap.LookupForward(this.documentUri, position.line + 1, // VS Code deviates from the source map standard here... 0 vs. 1 based line numbers
        position.character)[0];
        if (fullyResolvedAndMergedDefinitionLocation) {
            const path = fullyResolvedAndMergedDefinitionLocation.path;
            if (path) {
                // is $ref?
                if (path.length > 0 && path[path.length - 1] === "$ref") {
                    // lookup object
                    const refValueJsonPointer = jsonpath_2.value(this.fullyResolvedAndMergedDefinition, jsonpath_2.stringify(path));
                    const refValueJsonPath = jsonpath_1.parseJsonPointer(refValueJsonPointer);
                    return jsonpath_2.stringify(refValueJsonPath);
                }
            } // else  { console.warn("no object path for that location"); return null; }
        } // else { console.log("reverse lookup failed (no big deal, may just hover empty space)"); return null; }
        return null;
    }
    /**
     * Retrieves all document locations (VS Code understands) corresponding with given JSON query.
     */
    *GetDocumentLocations(jsonQuery) {
        for (const path of jsonpath_2.paths(this.fullyResolvedAndMergedDefinition, jsonQuery)) {
            for (const mappingItem of this.fullyResolvedAndMergedDefinitionMap.LookupPath(path.slice(1))) {
                yield {
                    uri: mappingItem.source,
                    range: {
                        start: {
                            line: mappingItem.originalLine - 1,
                            character: mappingItem.originalColumn
                        },
                        end: {
                            line: mappingItem.originalLine - 1,
                            character: mappingItem.originalColumn // TODO: room for improvement. think there even is extended information in `name`!
                        }
                    }
                };
            }
        }
    }
    /**
     * Retrieves all locations in the entire OpenAPI definition (and corresponding values) matching given JSON query.
     */
    *GetDefinitionLocations(jsonQuery) {
        for (const path of jsonpath_2.nodes(this.fullyResolvedAndMergedDefinition, jsonQuery)) {
            yield {
                value: path.value,
                jsonPath: jsonpath_2.stringify(path.path)
            };
        }
    }
}
exports.DocumentAnalysis = DocumentAnalysis;
//# sourceMappingURL=document-analysis.js.map