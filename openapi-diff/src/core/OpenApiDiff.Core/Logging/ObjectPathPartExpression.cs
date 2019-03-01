using System;
using YamlDotNet.RepresentationModel;

namespace OpenApiDiff.Core.Logging
{
    public sealed class ObjectPathPartExpression : ObjectPathPart
    {
        public override string JsonPointer => throw new NotImplementedException();

        public override string JsonPath => throw new NotImplementedException();

        public override object RawPath => throw new NotImplementedException();
    }
}
