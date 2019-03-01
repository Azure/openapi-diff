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

        private object GetFormattedMessage(IList<ComparisonMessage> list)
        {
            IList<object> array = new List<object>();
            foreach (var message in list)
            {
                array.Add(message.GetValidationMessagesAsJson());
            }
            return array;
        }

        private string GetFormattedMessageString(IList<ComparisonMessage> list)
        {
            string output = "[";
            foreach (var message in list)
            {
                output = output == "[" ? $"{output}{message.ToString()}" : $"{output},{message.ToString()}";
            }
            output = $"{output}]";
            return output;
        }

        public object GetValidationMessagesAsJson()
        {
            var rawMessage = new Dictionary<string, object>();

            rawMessage["errors"] = GetFormattedMessage(this.Errors);
            rawMessage["warnings"] = GetFormattedMessage(this.Warnings);
            rawMessage["info"] = GetFormattedMessage(this.Info);

            return rawMessage;
        }

        public override string ToString()
        {
            return $"errors = {GetFormattedMessageString(this.Errors)}, warnings = {GetFormattedMessageString(this.Warnings)}, info = {GetFormattedMessageString(this.Info)}";
        }
    }
}