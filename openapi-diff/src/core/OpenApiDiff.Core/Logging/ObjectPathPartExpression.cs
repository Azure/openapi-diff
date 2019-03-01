using Newtonsoft.Json.Linq;
using System;

namespace OpenApiDiff.Core.Logging
{
    public sealed class ObjectPathPartExpression : ObjectPathPart
    {
        private readonly Func<JToken, string> _GetPropertyName;

        public ObjectPathPartExpression(Func<JToken, string> getPropertyName)
        {
            _GetPropertyName = getPropertyName;
        }

        public override string GetPropertyName(JToken t) => _GetPropertyName(t);
    }
}
