// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using YamlDotNet.RepresentationModel;

namespace OpenApiDiff.Core.Logging
{
    /// <summary>
    /// Represents a path into an object.
    /// </summary>
    public class ObjectPath
    {
        public static ObjectPath Empty => new ObjectPath(Enumerable.Empty<Func<JToken, string>>());

        private ObjectPath(IEnumerable<Func<JToken, string>> path)
        {
            Path = path;
        }

        private ObjectPath Append(Func<JToken, string> f) => new ObjectPath(Path.Concat(new[] { f }));

        public ObjectPath AppendProperty(string property) => Append((_) => property);

        public IEnumerable<Func<JToken, string>> Path { get; }

        public IEnumerable<(JToken token, string name)> CompletePath(JToken t)
            => Path.Select(v => {
                var name = v(t);
                t =
                    t is JArray a ? int.TryParse(name, out var i) ? a[i] : null :
                    t is JObject o ? o[name] :
                    null;
                return (t, name);
            });

        // https://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-04
        public string JsonPointer(JToken t) => CompletePath(t)
            .Select(v => v.name.Replace("~", "~0").Replace("/", "~1"))
            .Aggregate("", (a, b) => a + "/" + b);
            

        public ObjectPath AppendExpression(Func<JToken, string> func)
            => Append(func);
    }
}
