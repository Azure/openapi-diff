// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.Swagger.Model;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using OpenApiDiff.Core;
using OpenApiDiff.Core.Logging;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace AutoRest.Swagger
{
    /// <summary>
    /// Represents a single validation violation.
    /// </summary>
    public class ComparisonMessage
    {
        public static string DocBaseUrl = "https://github.com/Azure/openapi-diff/tree/master/docs/rules/";

        public ComparisonMessage(
            MessageTemplate template,
            ObjectPath path,
            IParsedJson old,
            IParsedJson @new,
            Category severity,
            params object[] formatArguments
        )
        {
            Severity = severity;
            Message = $"{string.Format(CultureInfo.CurrentCulture, template.Message, formatArguments)}";
            Path = path;
            Old = old;
            New = @new;
            Id = template.Id;
            Code = template.Code;
            DocUrl = $"{DocBaseUrl}{template.Id}.md";
            Mode = template.Type;
        }

        public IParsedJson Old { get; }

        public IParsedJson New { get; }

        public Category Severity { get; }

        public string Message { get; }

        /// <summary>
        /// The JSON document path to the element being validated.
        /// </summary>
        public ObjectPath Path { get; }

        public string OldJsonRef => Path.JsonPointer(Old);

        public JToken OldJson() => Path.CompletePath(Old.Token).Last().token;

        public string NewJsonRef => Path.JsonPointer(New);

        public JToken NewJson() => Path.CompletePath(New.Token).Last().token;

        /// <summary>
        /// The id of the validation message
        /// </summary>
        public int Id { get; }

        /// <summary>
        /// The code of the validation message
        /// </summary>
        public string Code { get; }

        /// <summary>
        /// Documentation Url for the Message
        /// </summary>
        public string DocUrl { get; }

        /// <summary>
        /// Type for the Message
        /// </summary>
        public MessageType Mode { get; }

        private static string Location(IParsedJson j, JToken t)
        {
            IJsonLineInfo x = t;
            return x == null ? "" : $"{j.FileName}:{x.LineNumber}:{x.LinePosition}";
        }

        public string OldLocation() => Location(Old, OldJson());

        public string NewLocation() => Location(New, NewJson());

        public string GetValidationMessagesAsJson()
        {
            var rawMessage = new Dictionary<string, string>();
            rawMessage["id"] = Id.ToString();
            rawMessage["code"] = Code.ToString();
            rawMessage["message"] = Message;
            rawMessage["jsonref-old"] = OldJsonRef;
            rawMessage["location-old"] = OldLocation(); 
            rawMessage["jsonref-new"] = NewJsonRef;
            rawMessage["location-old"] = NewLocation();
            rawMessage["type"] = Severity.ToString();
            rawMessage["docurl"] = DocUrl.ToString();
            rawMessage["mode"] = Mode.ToString();

            return JsonConvert.SerializeObject(rawMessage, Formatting.Indented);
        }

        public override string ToString()
            => $"code = {Code}, type = {Severity}, message = {Message}, docurl = {DocUrl}, mode = {Mode}";
    }

    public class CustomComparer : IEqualityComparer<ComparisonMessage>
    {
        public bool Equals(ComparisonMessage message1, ComparisonMessage message2)
            => message1.Message == message2.Message;

        public int GetHashCode(ComparisonMessage obj)
            => obj.Message.GetHashCode();
    }
}