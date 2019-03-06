// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;

namespace AutoRest.Swagger.Model
{
    /// <summary>
    /// Describes a single response from an API Operation.
    /// </summary>
    public class OperationResponse : SwaggerBase<OperationResponse>
    {
        public string Description { get; set; }

        public Schema Schema { get; set; }

        public Dictionary<string, Header> Headers { get; set; }

        public Dictionary<string, object> Examples { get; set; }

        /// <summary>
        /// Compare a modified document node (this) to a previous one and look for breaking as well as non-breaking changes.
        /// </summary>
        /// <param name="context">The modified document context.</param>
        /// <param name="previous">The original document model.</param>
        /// <returns>A list of messages from the comparison.</returns>
        public override IEnumerable<ComparisonMessage> Compare(
            ComparisonContext<ServiceDefinition> context, OperationResponse previous)
        {
            var priorResponse = previous;

            if (priorResponse == null)
            {
                throw new ArgumentNullException("previous");
            }
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            context.Direction = DataDirection.Response;

            base.Compare(context, previous);

            var headers = Headers != null ? Headers : new Dictionary<string, Header>();
            var priorHeaders = priorResponse.Headers != null ? priorResponse.Headers : new Dictionary<string, Header>();

            foreach (var header in headers)
            {
                context.PushProperty(header.Key);

                if (!priorHeaders.TryGetValue(header.Key, out var oldHeader))
                {
                    context.LogInfo(ComparisonMessages.AddingHeader, header.Key);
                }
                else
                {
                    header.Value.Compare(context, oldHeader);
                }

                context.Pop();
            }

            foreach (var header in priorHeaders)
            {
                context.PushProperty(header.Key);

                if (!headers.TryGetValue(header.Key, out var newHeader))
                {
                    context.LogBreakingChange(ComparisonMessages.RemovingHeader, header.Key);
                }

                context.Pop();
            }

            // switch context to `schema` property.
            context.PushProperty("schema");
            if (Schema != null && priorResponse.Schema != null)
            {
                Schema.Compare(context, priorResponse.Schema);
            }
            context.Pop();

            context.Direction = DataDirection.None;

            return context.Messages;
        }
    }
}