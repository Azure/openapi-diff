using OpenApiDiff.Core.Logging;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace AutoRest.Swagger
{
    public class ComparisonMessagesType
    {
        public ComparisonMessagesType() {
            this.Errors = new List<ComparisonMessageV2>();
            this.Warnings = new List<ComparisonMessageV2>();
            this.Info = new List<ComparisonMessageV2>();
        }

        public IList<ComparisonMessageV2> Errors { get; }

        public IList<ComparisonMessageV2> Warnings { get; }

        public IList<ComparisonMessageV2> Info { get; }

        public void Add(MessageTemplate template, FileObjectPath path, Category category, params object[] formatArguments)
        {
            switch (category)
            {
                case Category.Error:
                    this.Errors.Add(new ComparisonMessageV2(template, path, category, formatArguments));
                    break;
                case Category.Info:
                    this.Info.Add(new ComparisonMessageV2(template, path, category, formatArguments));
                    break;
                case Category.Warning:
                    this.Warnings.Add(new ComparisonMessageV2(template, path, category, formatArguments));
                    break;
            }
        }

        private string GetFormattedMessage(IList<ComparisonMessageV2> list)
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