using OpenApiDiff.Core.Logging;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace AutoRest.Swagger
{
    public class ComparisonMessagesType
    {
        public ComparisonMessagesType() {
            this.Errors = new List<ComparisonMessage>();
            this.Warnings = new List<ComparisonMessage>();
            this.Info = new List<ComparisonMessage>();
        }

        public IList<ComparisonMessage> Errors { get; }

        public IList<ComparisonMessage> Warnings { get; }

        public IList<ComparisonMessage> Info { get; }

        public void Add(MessageTemplate template, FileObjectPath path, Category category, params object[] formatArguments)
        {
            switch (category)
            {
                case Category.Error:
                    this.Errors.Add(new ComparisonMessage(template, path, category, formatArguments));
                    break;
                case Category.Info:
                    this.Info.Add(new ComparisonMessage(template, path, category, formatArguments));
                    break;
                case Category.Warning:
                    this.Warnings.Add(new ComparisonMessage(template, path, category, formatArguments));
                    break;
            }
        }

        private string GetFormattedMessage(IList<ComparisonMessage> list)
        {
            string formattedMessage = "[";
            foreach (var message in list)
            {
                formattedMessage = $"{formattedMessage},{message.GetValidationMessagesAsJson()}";
            }
            formattedMessage = $"{formattedMessage}]";
            return formattedMessage;
        }

        public string GetValidationMessagesAsJson()
        {
            var rawMessage = new Dictionary<string, string>();

            rawMessage["errors"] = GetFormattedMessage(this.Errors);
            rawMessage["warnings"] = GetFormattedMessage(this.Warnings);
            rawMessage["info"] = GetFormattedMessage(this.Info);
            return JsonConvert.SerializeObject(rawMessage, Formatting.Indented);
        }

        public override string ToString()
        {
            return $"errors = {this.Errors.ToString()}, warnings = {this.Warnings.ToString()}, info = {this.Info.ToString()}";
        }
    }
}