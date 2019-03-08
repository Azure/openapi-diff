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
            IJsonDocument oldDoc,
            IJsonDocument newDoc,
            Category severity,
            params object[] formatArguments
        )
        {
            Severity = severity;
            Message = $"{string.Format(CultureInfo.CurrentCulture, template.Message, formatArguments)}";
            Path = path;
            OldDoc = oldDoc;
            NewDoc = newDoc;
            Id = template.Id;
            Code = template.Code;
            DocUrl = $"{DocBaseUrl}{template.Id}.md";
            Mode = template.Type;
        }

        public IJsonDocument OldDoc { get; }

        public IJsonDocument NewDoc { get; }

        public Category Severity { get; }

        public string Message { get; }

        /// <summary>
        /// The JSON document path to the element being validated.
        /// </summary>
        private ObjectPath Path { get; }

        public string OldJsonRef => Path.JsonPointer(OldDoc);

        /// <summary>
        /// A JToken from the old document that contains such information as location.
        /// </summary>
        /// <seealso cref="IJsonLineInfo"/>
        /// <returns></returns>
        public JToken OldJson() => Path.CompletePath(OldDoc.Token).Last().token;

        public string NewJsonRef => Path.JsonPointer(NewDoc);

        /// <summary>
        /// A JToken from the new document that contains such information as location.
        /// </summary>
        /// <seealso cref="IJsonLineInfo"/>
        /// <returns></returns>
        public JToken NewJson() => Path.CompletePath(NewDoc.Token).Last().token;

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

        /// <summary>
        /// Return a location of the given JSON token `t` in the document `j`.
        /// </summary>
        /// <param name="jsonDoc"></param>
        /// <param name="jsonToken"></param>
        /// <returns>a string in this format `fileName:lineNumber:linePosition`</returns>
        private static string Location(IJsonDocument jsonDoc, JToken jsonToken)
        {
            // up cast.
            IJsonLineInfo x = jsonToken;
            return x == null ? 
                null : 
                $"{ObjectPath.FileNameNorm(jsonDoc.FileName)}:{x.LineNumber}:{x.LinePosition}";
        }

        public string OldLocation() => Location(OldDoc, OldJson());

        public string NewLocation() => Location(NewDoc, NewJson());

        public string GetValidationMessagesAsJson()
        {
            var rawMessage = new JsonComparisonMessage
            {
                id = Id.ToString(),
                code = Code.ToString(),
                message = Message,
                type = Severity.ToString(),
                docurl = DocUrl.ToString(),
                mode = Mode.ToString(),
                old = new JsonLocation
                {
                    @ref = OldJsonRef,
                    path = OldJson()?.Path,
                    location = OldLocation(),
                },
                @new = new JsonLocation
                {
                    @ref = NewJsonRef,
                    path = NewJson()?.Path,
                    location = NewLocation(),
                }
            };

            return JsonConvert.SerializeObject(
                rawMessage, 
                Formatting.Indented,
                new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore }
            );
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