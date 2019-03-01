// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Newtonsoft.Json.Linq;

namespace OpenApiDiff.Core.Logging
{
    public class ObjectPathPartIndex : ObjectPathPart
    {
        public ObjectPathPartIndex(int index)
        {
            Index = index;
        }

        public int Index { get; }

        public override string JsonPointer(JToken _) => $"/{Index + 1}";

        public override string JsonPath(JToken _) => $"[{Index + 1}]";
    }
}
