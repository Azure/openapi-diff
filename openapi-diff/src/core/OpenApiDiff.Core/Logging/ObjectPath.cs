// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;

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

        public ObjectPath AppendItemByName(string value) => Append(t =>
        {
            var list = t
                ?.Select((v, i) => (v, i))
                ?.Where(vi => vi.v?["name"]?.Value<string>() == value)
                ?.ToList();
            return list == null || list.Count == 0 ? null : list[0].i.ToString();
        });

        public IEnumerable<Func<JToken, string>> Path { get; }

        private static IEnumerable<Func<JToken, string>> ParseRef(string s)
            => s
                .Split('/')
                .Where(v => v != "#")
                .Select<string, Func<JToken, string>>(v => _ => v.Replace("~1", "/").Replace("~0", "~"));

        private static JToken FromObject(JObject o, string name)
        {
            var @ref = o["$ref"];
            var unrefed = @ref != null ? CompletePath(ParseRef(@ref.Value<string>()), o.Root).Last().token : o;
            return unrefed[name];
        }

        private static IEnumerable<(JToken token, string name)> CompletePath(IEnumerable<Func<JToken, string>> p, JToken t)
            => p.Select(v => {
                var name = v(t);
                t =
                    t is JArray a ? int.TryParse(name, out var i) ? a[i] : null :
                    t is JObject o ? FromObject(o, name) :
                    null;
                return (t, name);
            });

        public IEnumerable<(JToken token, string name)> CompletePath(JToken t)
            => CompletePath(Path, t);

        // https://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-04
        public string JsonPointer(IParsedJson t) => CompletePath(t.Token)
            .Select(v => v.name?.Replace("~", "~0")?.Replace("/", "~1"))
            .Aggregate("", (a, b) => a == null || b == null ? null : a + "/" + b);
            

        public ObjectPath AppendExpression(Func<JToken, string> func)
            => Append(func);
    }
}
