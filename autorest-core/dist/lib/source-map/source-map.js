"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAssignmentMapping = exports.Compile = exports.CompilePosition = exports.EncodeEnhancedPositionInName = exports.TryDecodeEnhancedPositionFromName = void 0;
const text_utility_1 = require("../parsing/text-utility");
const yaml_1 = require("../ref/yaml");
const jsonpath_1 = require("../ref/jsonpath");
const yaml = require("../parsing/yaml");
// for carrying over rich information into the realm of line/col based source maps
// convention: <original name (contains no `nameWithPathSeparator`)>\n(<path>)
const enhancedPositionSeparator = "\n\n(";
const enhancedPositionEndMark = ")";
function TryDecodeEnhancedPositionFromName(name) {
    try {
        if (!name) {
            return undefined;
        }
        const sepIndex = name.indexOf(enhancedPositionSeparator);
        if (sepIndex === -1 || !name.endsWith(enhancedPositionEndMark)) {
            return undefined;
        }
        const secondPart = name.slice(sepIndex + 3, name.length - 1);
        return JSON.parse(secondPart);
    }
    catch (e) {
        return undefined;
    }
}
exports.TryDecodeEnhancedPositionFromName = TryDecodeEnhancedPositionFromName;
function EncodeEnhancedPositionInName(name, pos) {
    if (name && name.indexOf(enhancedPositionSeparator) !== -1) {
        name = name.split(enhancedPositionSeparator)[0];
    }
    return (name || "") + enhancedPositionSeparator + JSON.stringify(pos, null, 2) + enhancedPositionEndMark;
}
exports.EncodeEnhancedPositionInName = EncodeEnhancedPositionInName;
function CompilePosition(position, yamlFile) {
    if (!position.line) {
        if (position.path) {
            return yaml.ResolvePath(yamlFile, position.path);
        }
        if (position.index) {
            return text_utility_1.IndexToPosition(yamlFile, position.index);
        }
    }
    return position;
}
exports.CompilePosition = CompilePosition;
function Compile(mappings, target, yamlFiles = []) {
    // build lookup
    const yamlFileLookup = {};
    for (const yamlFile of yamlFiles) {
        yamlFileLookup[yamlFile.key] = yamlFile;
    }
    const generatedFile = target.toJSON().file;
    const compilePos = (position, key) => {
        if (position.path && !yamlFileLookup[key]) {
            throw new Error(`File '${key}' was not passed along with 'yamlFiles' (got '${JSON.stringify(yamlFiles.map(x => x.key))}')`);
        }
        return CompilePosition(position, yamlFileLookup[key]);
    };
    for (const mapping of mappings) {
        const compiledGenerated = compilePos(mapping.generated, generatedFile);
        const compiledOriginal = compilePos(mapping.original, mapping.source);
        target.addMapping({
            generated: compiledGenerated,
            original: compiledOriginal,
            name: EncodeEnhancedPositionInName(mapping.name, compiledOriginal),
            source: mapping.source
        });
    }
}
exports.Compile = Compile;
function CreateAssignmentMapping(assignedObject, sourceKey, sourcePath, targetPath, subject) {
    const result = [];
    for (const descendant of yaml_1.Descendants(yaml_1.ToAst(assignedObject))) {
        const path = descendant.path;
        result.push({
            name: `${subject} (${jsonpath_1.stringify(path)})`, source: sourceKey,
            original: { path: sourcePath.concat(path) },
            generated: { path: targetPath.concat(path) }
        });
    }
    return result;
}
exports.CreateAssignmentMapping = CreateAssignmentMapping;
//# sourceMappingURL=source-map.js.map