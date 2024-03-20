/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IndexToPosition } from "../parsing/text-utility";
import { EnhancedPosition, Mappings, SmartPosition } from "../ref/source-map";
import { Descendants, ToAst } from "../ref/yaml";
import { JsonPath, stringify } from "../ref/jsonpath";
import * as yaml from "../parsing/yaml";
import { DataHandle } from "../data-store/data-store";

// for carrying over rich information into the realm of line/col based source maps
// convention: <original name (contains no `nameWithPathSeparator`)>\n(<path>)
const enhancedPositionSeparator = "\n\n(";
const enhancedPositionEndMark = ")";
export function TryDecodeEnhancedPositionFromName(name: string | undefined): EnhancedPosition | undefined {
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
  } catch (e) {
    return undefined;
  }
}
export function EncodeEnhancedPositionInName(name: string | undefined, pos: EnhancedPosition): string {
  if (name && name.indexOf(enhancedPositionSeparator) !== -1) {
    name = name.split(enhancedPositionSeparator)[0];
  }
  return (name || "") + enhancedPositionSeparator + JSON.stringify(pos, null, 2) + enhancedPositionEndMark;
}

export function CompilePosition(position: SmartPosition, yamlFile: DataHandle): EnhancedPosition {
  if (!(position as EnhancedPosition).line) {
    if ((position as any).path) {
      return yaml.ResolvePath(yamlFile, (position as any).path);
    }
    if ((position as any).index) {
      return IndexToPosition(yamlFile, (position as any).index);
    }
  }
  return position as EnhancedPosition;
}

export function Compile(mappings: Mappings, target: sourceMap.SourceMapGenerator, yamlFiles: DataHandle[] = []): void {
  // build lookup
  const yamlFileLookup: { [key: string]: DataHandle } = {};
  for (const yamlFile of yamlFiles) {
    yamlFileLookup[yamlFile.key] = yamlFile;
  }

  const generatedFile = target.toJSON().file;
  const compilePos = (position: SmartPosition, key: string) => {
    if ((position as any).path && !yamlFileLookup[key]) {
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

export function CreateAssignmentMapping(assignedObject: any, sourceKey: string, sourcePath: JsonPath, targetPath: JsonPath, subject: string): Mappings {
  const result: Mappings = [];
  for (const descendant of Descendants(ToAst(assignedObject))) {
    const path = descendant.path;
    result.push({
      name: `${subject} (${stringify(path)})`, source: sourceKey,
      original: { path: sourcePath.concat(path) },
      generated: { path: targetPath.concat(path) }
    });
  }
  return result;
}