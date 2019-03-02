// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.Swagger.Model;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
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
        public ComparisonMessage(
            MessageTemplate template, 
            FileObjectPath path,
            JToken old,
            JToken @new,
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
        }

        public JToken Old { get; }

        public JToken New { get; }

        public Category Severity { get; }

        public string Message { get; }

        /// <summary>
        /// The JSON document path to the element being validated.
        /// </summary>
        public FileObjectPath Path { get; }

        public string OldJsonRef => Path.JsonReference(Old);

        public JToken OldJson() => Path.ObjectPath.CompletePath(Old).Last().token;

        public string NewJsonRef => Path.JsonReference(New);

        public JToken NewJson() => Path.ObjectPath.CompletePath(New).Last().token;

        /// <summary>
        /// The id of the validation message
        /// </summary>
        public int Id { get; }

        /// <summary>
        /// The code of the validation message
        /// </summary>
        public string Code { get; }

        public string GetValidationMessagesAsJson()
        {
            var rawMessage = new Dictionary<string, string>
            {
                ["id"] = Id.ToString(),
                ["code"] = Code.ToString(),
                ["message"] = Message,
                ["jsonref-old"] = Path?.JsonReference(Old),
                ["jsonref-new"] = Path?.JsonReference(New),
                // ["json-path"] = Path?.JsonPath,
                ["type"] = Severity.ToString(),
            };

            return JsonConvert.SerializeObject(rawMessage, Formatting.Indented);
        }

        public override string ToString()
            => $"code = {Code}, type = {Severity}, message = {Message}";
    }

    public class CustomComparer : IEqualityComparer<ComparisonMessage>
    {
        public bool Equals(ComparisonMessage message1, ComparisonMessage message2)
            => message1.Message == message2.Message;

        public int GetHashCode(ComparisonMessage obj)
            => obj.Message.GetHashCode();
    }
}