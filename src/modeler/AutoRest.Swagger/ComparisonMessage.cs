// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.Core.Logging;
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
            Message = $"Comparison: {template.Id} - {string.Format(CultureInfo.CurrentCulture, template.Message, formatArguments)}";
            Path = path;
            Id = template.Id;
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
    }
}