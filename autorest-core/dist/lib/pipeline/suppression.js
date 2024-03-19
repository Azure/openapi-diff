"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Suppressor = void 0;
const jsonpath_1 = require("../ref/jsonpath");
const linq_1 = require("../ref/linq");
class Suppressor {
    constructor(config) {
        this.config = config;
        this.suppressions = config.Directives.filter(x => [...x.suppress].length > 0);
    }
    MatchesSourceFilter(document, path, supression) {
        // from
        const from = linq_1.From(supression.from);
        const matchesFrom = !from.Any() || from.Any(d => document.toLowerCase().endsWith(d.toLowerCase()));
        // where
        const where = linq_1.From(supression.where);
        const matchesWhere = !where.Any() || (path && where.Any(w => jsonpath_1.matches(w, path))) || false;
        return matchesFrom && matchesWhere;
    }
    Filter(m) {
        // the message does not have a source attached to it - assume it may pass
        if (!m.Source || m.Source.length === 0) {
            return m;
        }
        // filter
        for (const sup of this.suppressions) {
            // matches key
            if (linq_1.From(m.Key || []).Any(k => linq_1.From(sup.suppress).Any(s => k.toLowerCase() === s.toLowerCase()))) {
                // filter applicable sources
                m.Source = m.Source.filter(s => !this.MatchesSourceFilter(s.document, s.Position.path, sup));
            }
        }
        // drop message if all source locations have been stripped
        if (m.Source.length === 0) {
            return null;
        }
        return m;
    }
}
exports.Suppressor = Suppressor;
//# sourceMappingURL=suppression.js.map