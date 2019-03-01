using OpenApiDiff.Core.Logging;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Collections;

namespace AutoRest.Swagger
{
    public class ComparisonMessagesObject
    {
        public ComparisonMessagesObject() {
            this.Additions = new ComparisonMessagesType();
            this.Updates = new ComparisonMessagesType();
            this.Removals = new ComparisonMessagesType();
        }

        public ComparisonMessagesType Additions { get; }

        public ComparisonMessagesType Updates { get; }

        public ComparisonMessagesType Removals { get; }

        public void Add(MessageTemplate template, FileObjectPath path, Category category, params object[] formatArguments)
        {
            switch(template.Type)
            {
                case MessageType.Addition:
                    this.Additions.Add(template, path, category, formatArguments);
                    break;
                case MessageType.Removal:
                    this.Removals.Add(template, path, category, formatArguments);
                    break;
                case MessageType.Update:
                    this.Updates.Add(template, path, category, formatArguments);
                    break;
            }
        }

        public string GetValidationMessagesAsJson()
        {
            var rawMessage = new Dictionary<string, string>();
            rawMessage["additions"] = this.Additions.GetValidationMessagesAsJson();
            rawMessage["updates"] = this.Updates.GetValidationMessagesAsJson();
            rawMessage["removals"] = this.Removals.GetValidationMessagesAsJson();
            return JsonConvert.SerializeObject(rawMessage, Formatting.Indented);
        }

        public override string ToString()
        {
            return $"additions = {this.Additions.ToString()}, updates = {this.Updates.ToString()}, removals = {this.Removals.ToString()}";
        }
    }
}