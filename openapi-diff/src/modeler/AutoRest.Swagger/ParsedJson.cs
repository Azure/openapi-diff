using Newtonsoft.Json.Linq;
using OpenApiDiff.Core.Logging;
using System.Linq;

namespace AutoRest.Swagger
{
    public sealed class ParsedJson<T>
    {
        public JToken Token { get; }

        public T Typed { get; }

        public ParsedJson(JToken token, T typed)
        {
            Token = token;
            Typed = typed;
        }

        public JToken GetPosition(ObjectPath path)
        {
            var r = path.Path.Aggregate(
                Token,
                (t, part) =>
                    t is JArray a ? (part is ObjectPathPartIndex index ? a[index.Index] : null) :
                    t is JObject o ? (part is ObjectPathPartProperty property ? o[property.Property] : null) :
                    null
                );
            return r;
        }
    }

    internal static class ParsedJson
    {
        public static ParsedJson<T> ToParsedJson<T>(this JToken token, T typed)
            => new ParsedJson<T>(token, typed);
    }
}
