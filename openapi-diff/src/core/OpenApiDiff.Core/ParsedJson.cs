using Newtonsoft.Json.Linq;

namespace OpenApiDiff.Core
{
    public interface IParsedJson
    {
        JToken Token { get; }

        string FileName { get; }
    }

    public sealed class ParsedJson<T>: IParsedJson
    {
        public JToken Token { get; }

        public T Typed { get; }

        public string FileName { get; }

        public ParsedJson(JToken token, T typed, string fileName)
        {
            Token = token;
            Typed = typed;
            FileName = fileName;
        }
    }

    public static class ParsedJson
    {
        public static ParsedJson<T> ToParsedJson<T>(this JToken token, T typed, string fileName)
            => new ParsedJson<T>(token, typed, fileName);
    }
}
