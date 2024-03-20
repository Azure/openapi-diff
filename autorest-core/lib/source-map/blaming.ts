/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { JsonPath } from "../ref/jsonpath";
import { EncodeEnhancedPositionInName, TryDecodeEnhancedPositionFromName } from "./source-map";
import { DataStore } from "../data-store/data-store";
import { From } from "../ref/linq";

export class BlameTree {
  public static Create(dataStore: DataStore, position: sourceMap.MappedPosition): BlameTree {
    const data = dataStore.ReadStrictSync(position.source);
    const blames = data.Blame(position);

    // propagate smart position
    const enhanced = TryDecodeEnhancedPositionFromName(position.name);
    if (enhanced !== undefined) {
      for (const blame of blames) {
        blame.name = EncodeEnhancedPositionInName(blame.name, { ...enhanced, ...TryDecodeEnhancedPositionFromName(blame.name) });
      }
    }

    return new BlameTree(position, blames.map(pos => BlameTree.Create(dataStore, pos)));
  }

  private constructor(
    public readonly node: sourceMap.MappedPosition & { path?: JsonPath },
    public readonly blaming: BlameTree[]) { }

  public BlameLeafs(): sourceMap.MappedPosition[] {
    const result: sourceMap.MappedPosition[] = [];

    const todos: BlameTree[] = [this];
    let todo: BlameTree | undefined;
    while (todo = todos.pop()) {
      // report self
      if (todo.blaming.length === 0) {
        result.push({
          column: todo.node.column,
          line: todo.node.line,
          name: todo.node.name,
          source: todo.node.source
        });
      }
      // recurse
      todos.push(...todo.blaming);
    }
    return From(result).Distinct(x => JSON.stringify(x)).ToArray();
  }
}

