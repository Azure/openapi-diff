// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Newtonsoft.Json.Linq;
using YamlDotNet.RepresentationModel;

namespace OpenApiDiff.Core.Logging
{
    public abstract class ObjectPathPart
    {
        public abstract string JsonPointer(JToken t);

        public abstract string JsonPath(JToken t);
    }
}
