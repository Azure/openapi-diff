// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Newtonsoft.Json;
using OpenApiDiff.Core.Logging;
using System.Collections.Generic;
using System.Globalization;

namespace AutoRest.Swagger
{
    /// <summary>
    /// Represents a single validation violation.
    /// </summary>
    public class ComparisonMessage
    {
        public ComparisonMessage(MessageTemplate template, FileObjectPath path, Category severity, params object[] formatArguments)
        {
            Severity = severity;
            Message = $"{string.Format(CultureInfo.CurrentCulture, template.Message, formatArguments)}";
            Path = path;
            Id = template.Id;
            Code = template.Code;
        }

        public Category Severity { get; }

        public string Message { get; }

        /// <summary>
        /// The JSON document path to the element being validated.
        /// </summary>
        public FileObjectPath Path { get; }

        /// <summary>
        /// The id of the validation message
        /// </summary>
        public int Id { get; private set; }

        /// <summary>
        /// The code of the validation message
        /// </summary>
        public string Code { get; private set; }

        public string GetValidationMessagesAsJson()
        {
            var rawMessage = new Dictionary<string, string>();
            rawMessage["id"] = Id.ToString();
            rawMessage["code"] = Code.ToString();
            rawMessage["message"] = Message;
            rawMessage["jsonref"] = Path?.JsonReference;
            rawMessage["json-path"] = Path?.ReadablePath;
            rawMessage["type"] = Severity.ToString();

            return JsonConvert.SerializeObject(rawMessage, Formatting.Indented);
        }

        public override string ToString()
        {
            return $"code = {Code}, type = {Severity}, message = {Message}";
        }
    }

    public class CustomComparer : IEqualityComparer<ComparisonMessage>
    {
        public bool Equals(ComparisonMessage message1, ComparisonMessage message2)
        {
            return message1.Message == message2.Message;
        }

        public int GetHashCode(ComparisonMessage obj)
        {
            return obj.Message.GetHashCode();
        }
    }
}