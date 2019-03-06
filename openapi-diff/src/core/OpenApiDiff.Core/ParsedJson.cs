﻿using Newtonsoft.Json.Linq;

namespace OpenApiDiff.Core
{
    /// <summary>
    /// An interface for untyped parsed JSON.
    /// </summary>
    public interface IParsedJson
    {
        JToken Token { get; }

        string FileName { get; }
    }

    /// <summary>
    /// A representation of parsed JSON.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public sealed class ParsedJson<T>: IParsedJson
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
