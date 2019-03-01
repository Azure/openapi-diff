﻿using OpenApiDiff.Core.Logging;
using System.Globalization;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace AutoRest.Swagger
{
    public class ComparisonMessage
    {
        public static string DocBaseUrl = "https://github.com/Azure/openapi-diff/tree/master/docs/rules/";

        public ComparisonMessage(MessageTemplate template, FileObjectPath path, Category category, params object[] formatArguments) {
            Message = $"{string.Format(CultureInfo.CurrentCulture, template.Message, formatArguments)}";
            Path = path;
            Id = template.Id;
            Code = template.Code;
            DocUrl = $"{DocBaseUrl}{template.Id}.md";
        }

        public string Message { get; }

        public FileObjectPath Path { get; }

        public int Id { get; }

        public string Code { get; }

        public string DocUrl { get; }

        public object GetValidationMessagesAsJson()
        {
            var rawMessage = new Dictionary<string, string>();
            rawMessage["message"] = Message;
            rawMessage["jsonref"] = Path?.JsonReference;
            rawMessage["json-path"] = Path?.ReadablePath;
            rawMessage["id"] = Id.ToString();
            rawMessage["code"] = Code.ToString();
            rawMessage["docurl"] = DocUrl.ToString();
            return rawMessage;
        }

        public override string ToString()
        {
            return $"code = {Code}, message = {Message}, docurl = {DocUrl}";
        }

    }
}