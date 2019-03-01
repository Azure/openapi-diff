// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Newtonsoft.Json.Linq;

namespace OpenApiDiff.Core.Logging
{
    public class ObjectPathPartProperty : ObjectPathPart
    {
        public ObjectPathPartProperty(string property)
        {
            Property = property;
        }

        public string Property { get; }

        public override string GetPropertyName(JToken _) => Property;
    }
}
