using Newtonsoft.Json.Linq;

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
    }

    internal static class ParsedJson
    {
        public static ParsedJson<T> ToParsedJson<T>(this JToken token, T typed)
            => new ParsedJson<T>(token, typed);
    }
}
