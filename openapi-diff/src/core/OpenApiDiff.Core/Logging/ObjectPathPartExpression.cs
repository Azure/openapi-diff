using Newtonsoft.Json.Linq;
using System;
using YamlDotNet.RepresentationModel;

namespace OpenApiDiff.Core.Logging
{
    public sealed class ObjectPathPartExpression : ObjectPathPart
    {
        public override string JsonPointer(JToken t) => throw new NotImplementedException();
    }
}
