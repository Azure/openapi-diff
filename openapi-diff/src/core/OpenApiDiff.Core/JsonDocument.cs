using Newtonsoft.Json.Linq;

namespace OpenApiDiff.Core
{
    /// <summary>
    /// An interface for untyped parsed JSON.
    /// </summary>
    public interface IJsonDocument
    {
        JToken Token { get; }

        string FileName { get; }
    }

    /// <summary>
    /// A representation of parsed JSON document.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public sealed class JsonDocument<T>: IJsonDocument
    {
        /// <summary>
        /// Untyped raw parsed JSON. The Token also includes information about 
        /// file location of each item.
        /// </summary>
        public JToken Token { get; }

        /// <summary>
        /// Representation of JSON as `T` type.
        /// </summary>
        public T Typed { get; }

        /// <summary>
        /// A JSON source file name.
        /// </summary>
        public string FileName { get; }

        public JsonDocument(JToken token, T typed, string fileName)
        {
            Token = token;
            Typed = typed;
            FileName = fileName;
        }
    }

    public static class JsonDocument
    {
        /// <summary>
        /// Creates a `JsonDocument` object. It's a syntax sugar for `new JsonDocument`.
        /// </summary>
        /// <typeparam name="T">Deserialization type.</typeparam>
        /// <param name="token">Raw JSON object. The object includes information about JSON token locations</param>
        /// <param name="typed">Representation of the JSON as `T` type.</param>
        /// <param name="fileName">A JSON source file name.</param>
        /// <returns></returns>
        public static JsonDocument<T> ToJsonDocument<T>(this JToken token, T typed, string fileName)
            => new JsonDocument<T>(token, typed, fileName);
    }
}
