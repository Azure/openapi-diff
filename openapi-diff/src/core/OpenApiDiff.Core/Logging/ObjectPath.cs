// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

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

        /// <summary>
        /// This's the OpenAPI path name. To use it as an id we need to remove all parameter names.
        /// For example, "/a/{a}/" and "/a/{b}" are the same paths.
        /// </summary>
        /// <param name="path"></param>
        /// <returns></returns>
        public static string OpenApiPathName(string path)
            => Regex.Replace(path, @"\{\w*\}", @"{}");

        /// <summary>
        /// Adding an Open API path.
        /// 
        /// For example, if the `opepApiPath` is "/subscription/{a}/{b}" then "a" and "b" parameters 
        /// will be removed from a search.
        /// </summary>
        /// <param name="openApiPath"></param>
        /// <returns></returns>
        public ObjectPath AppendPathProperty(string openApiPath) {
            var noParameters = OpenApiPathName(openApiPath);
            return Append(t =>
                (t as JObject)
                    ?.Properties()
                    ?.FirstOrDefault(p => OpenApiPathName(p.Name) == noParameters)
                    ?.Name
            );
        }

        public IEnumerable<Func<JToken, string>> Path { get; }

        private static ObjectPath ParseRef(string s)
            => new ObjectPath(s
                .Split('/')
                .Where(v => v != "#")
                .Select<string, Func<JToken, string>>(v => _ => v.Replace("~1", "/").Replace("~0", "~"))
            );

        private static JToken FromObject(JObject o, string name)
        {
            if (name == null)
            {
                return null;
            }
            
            var @ref = o["$ref"];
            
            // Handle $ref resolution based on its type
            if (@ref != null && @ref.Type == JTokenType.String)
            {
                // Case 1: $ref is a string reference (e.g., "#/definitions/FieldType")
                // Resolve the reference by parsing the path and following it to the target
                var unrefed = ParseRef(@ref.Value<string>()).CompletePath(o.Root).Last().token;
                return unrefed[name];
            }
            else
            {
                // Case 2: $ref is not a string (e.g., a JSON object defining a schema)
                // or $ref doesn't exist - use the current object directly
                return o[name];
            }
        }

        private static IEnumerable<(JToken token, string name)> CompletePath(IEnumerable<Func<JToken, string>> path, JToken token)
            => new[] { (token, "#") }
                .Concat(path.Select(v => {
                    var name = v(token);
                    token =
                        token is JArray a ? int.TryParse(name, out var i) ? a[i] : null :
                        token is JObject o ? FromObject(o, name) :
                        null;
                    return (token, name);
                }));

        /// <summary>
        /// Returns a sequence of property names, including the "#" string.
        /// </summary>
        /// <param name="t"></param>
        /// <returns></returns>
        public IEnumerable<(JToken token, string name)> CompletePath(JToken t)
            => CompletePath(Path, t);

        public static string FileNameNorm(string fileName) 
            => fileName.Replace("\\", "/");

        // https://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-04
        public string JsonPointer(IJsonDocument t)
        {
            var result = CompletePath(t.Token)
                .Select(v => v.name?.Replace("~", "~0")?.Replace("/", "~1"))
                .Aggregate((a, b) => a == null || b == null ? null : a + "/" + b);
            return result == null ? null : FileNameNorm(t.FileName) + result;
        }

        public ObjectPath AppendExpression(Func<JToken, string> func)
            => Append(func);
    }
}
