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
        public static ObjectPath Empty => new ObjectPath(Enumerable.Empty<ObjectPathPart>());

        private ObjectPath(IEnumerable<ObjectPathPart> path)
        {
            Path = path;
        }

        private ObjectPath Append(ObjectPathPart part) => new ObjectPath(Path.Concat(new[] { part }));

        public ObjectPath AppendProperty(string property) => Append(new ObjectPathPartProperty(property));

        public IEnumerable<ObjectPathPart> Path { get; }

        // https://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-04
        public string JsonPointer(JToken t) => Path.Aggregate(
            "", 
            (s, p) => s + "/" + p.GetPropertyName(t).Replace("~", "~0").Replace("/", "~1")
        );

        public ObjectPath AppendExpression(Func<JToken, string> func)
            => Append(new ObjectPathPartExpression(func));
    }
}
