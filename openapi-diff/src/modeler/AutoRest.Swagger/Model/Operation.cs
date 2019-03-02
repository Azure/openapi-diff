// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
using System;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace AutoRest.Swagger.Model
{
    /// <summary>
    /// Describes a single API operation on a path.
    /// </summary>
    public class Operation : SwaggerBase<Operation>
    {
        public Operation()
        {
            Consumes = new List<string>();
            Produces = new List<string>();
        }

        /// <summary>
        /// A list of tags for API documentation control.
        /// </summary>
        public IList<string> Tags { get; set; }

        /// <summary>
        /// A friendly serviceTypeName for the operation. The id MUST be unique among all
        /// operations described in the API. Tools and libraries MAY use the
        /// operation id to uniquely identify an operation.
        /// </summary>
        public string OperationId { get; set; }

        public string Summary { get; set; }
        public string Description { get; set; }

        /// <summary>
        /// Additional external documentation for this operation.
        /// </summary>
        public ExternalDoc ExternalDocs { get; set; }

        /// <summary>
        /// A list of MIME types the operation can consume.
        /// </summary>
        public IList<string> Consumes { get; set; }

        /// <summary>
        /// A list of MIME types the operation can produce.
        /// </summary>
        public IList<string> Produces { get; set; }

        /// <summary>
        /// A list of parameters that are applicable for this operation.
        /// If a parameter is already defined at the Path Item, the
        /// new definition will override it, but can never remove it.
        /// </summary>
        public IList<SwaggerParameter> Parameters { get; set; } = new List<SwaggerParameter>();

        /// <summary>
        /// The list of possible responses as they are returned from executing this operation.
        /// </summary>
        public Dictionary<string, OperationResponse> Responses { get; set; }

        /// <summary>
        /// The transfer protocol for the operation.
        /// </summary>
        public IList<TransferProtocolScheme> Schemes { get; set; }

        public bool Deprecated { get; set; }

        /// <summary>
        /// A declaration of which security schemes are applied for this operation.
        /// The list of values describes alternative security schemes that can be used
        /// (that is, there is a logical OR between the security requirements).
        /// This definition overrides any declared top-level security. To remove a
        /// top-level security declaration, an empty array can be used.
        /// </summary>
        public IList<Dictionary<string, List<string>>> Security { get; set; }

        /// <summary>
        /// Compare a modified document node (this) to a previous one and look for breaking as well as non-breaking changes.
        /// </summary>
        /// <param name="context">The modified document context.</param>
        /// <param name="previous">The original document model.</param>
        /// <returns>A list of messages from the comparison.</returns>
        public override IEnumerable<ComparisonMessage> Compare(
            ComparisonContext<ServiceDefinition> context,
            Operation previous
        )
        {
            var priorOperation = previous;

            var currentRoot = context.CurrentRoot;
            var previousRoot = context.PreviousRoot;

            if (priorOperation == null)
            {
                throw new ArgumentException("previous");
            }

            base.Compare(context, previous);

            if (!OperationId.Equals(priorOperation.OperationId))
            {
                context.LogBreakingChange(ComparisonMessages.ModifiedOperationId, priorOperation.OperationId, OperationId);
            }

            CheckParameters(context, priorOperation);

            if (Responses != null && priorOperation.Responses != null)
            {
                context.PushProperty("responses");
                foreach (var response in Responses)
                {
                    var oldResponse = priorOperation.FindResponse(response.Key, priorOperation.Responses);

                    context.PushProperty(response.Key);

                    if (oldResponse == null)
                    {
                        context.LogBreakingChange(ComparisonMessages.AddingResponseCode, response.Key);
                    }
                    else
                    {
                        response.Value.Compare(context, oldResponse);
                    }

                    context.Pop();
                }

                foreach (var response in priorOperation.Responses)
                {
                    var newResponse = this.FindResponse(response.Key, this.Responses);

                    if (newResponse == null)
                    {
                        context.PushProperty(response.Key);
                        context.LogBreakingChange(ComparisonMessages.RemovedResponseCode, response.Key);
                        context.Pop();
                    }
                }
                context.Pop();
            }

            return context.Messages;
        }

        /// <summary>
        /// Check that no parameters were removed or reordered, and compare them if it's not the case
        /// </summary>
        /// <param name="context">Comaprision Context</param>
        /// <param name="priorOperation">Operation object of old swagger</param>
        private void CheckParameters(ComparisonContext<ServiceDefinition> context, Operation priorOperation)
        {
            // Check that no parameters were removed or reordered, and compare them if it's not the case.

            var currentRoot = context.CurrentRoot;
            var previousRoot = context.PreviousRoot;

            context.PushProperty("parameters");

            var priorOperationParameters = priorOperation.Parameters.Select(param =>
                string.IsNullOrWhiteSpace(param.Reference) ? param : 
                FindReferencedParameter(param.Reference, previousRoot.Parameters)
            );
            foreach (var oldParam in priorOperationParameters)
            {
                SwaggerParameter newParam = FindParameter(oldParam.Name, Parameters, currentRoot.Parameters);

                context.PushProperty(oldParam.Name);

                if (newParam != null)
                {
                    newParam.Compare(context, oldParam);
                }
                else if (oldParam.IsRequired)
                {
                    // Removed required parameter
                    context.LogBreakingChange(ComparisonMessages.RemovedRequiredParameter, oldParam.Name);
                }

                context.Pop();
            }

            // Check that no required parameters were added.
            var requiredParamters = Parameters.Select(param =>
                                        string.IsNullOrWhiteSpace(param.Reference) ?
                                        param : FindReferencedParameter(param.Reference, currentRoot.Parameters))
                                        .Where(p => p != null && p.IsRequired);
            foreach (var newParam in requiredParamters)
            {
                if (newParam == null) continue;

                SwaggerParameter oldParam = FindParameter(newParam.Name, priorOperation.Parameters, previousRoot.Parameters);

                if (oldParam == null)
                {
                    // Did not find required parameter in the old swagger i.e required parameter is added
                    var key = newParam.Name;
                    /*
                    context.PushExpression(
                        t =>
                        {
                            return t
                                .Select((v, i) => (v, i))
                                .First(vi => vi.v["name"].Value<string>() == key)
                                .i
                                .ToString();
                        }
                    );
                    */
                    context.PushProperty(key);
                    context.LogBreakingChange(ComparisonMessages.AddingRequiredParameter, newParam.Name);
                    context.Pop();
                }
            }
            context.Pop();
        }

        /// <summary>
        /// Finds give parameter name in the list of operation parameters or global parameters
        /// </summary>
        /// <param name="name">name of the parameter to search</param>
        /// <param name="operationParameters">list of operation parameters to search</param>
        /// <param name="clientParameters">Dictionary of global paramters to search</param>
        /// <returns>Swagger Parameter if found; otherwise null</returns>
        private SwaggerParameter FindParameter(string name, IEnumerable<SwaggerParameter> operationParameters, IDictionary<string, SwaggerParameter> clientParameters)
        {
            if (Parameters != null)
            {
                foreach (var param in operationParameters)
                {
                    if (name.Equals(param.Name))
                        return param;

                    var pRef = FindReferencedParameter(param.Reference, clientParameters);

                    if (pRef != null && name.Equals(pRef.Name))
                    {
                        return pRef;
                    }
                }
            }
            return null;
        }

        private OperationResponse FindResponse(string name, IDictionary<string, OperationResponse> responses)
        {
            OperationResponse response = null;
            this.Responses.TryGetValue(name, out response);
            return response;
        }

        /// <summary>
        /// Finds referenced parameter
        /// </summary>
        /// <param name="reference">Name of the reference to search for</param>
        /// <param name="parameters">Dictionary of parameters for the search</param>
        /// <returns>Swagger Parameter if found; otherwise null</returns>
        private static SwaggerParameter FindReferencedParameter(
            string reference, IDictionary<string, SwaggerParameter> parameters
        )
        {
            if (reference != null && reference.StartsWith("#", StringComparison.Ordinal))
            {
                var parts = reference.Split('/');
                if (parts.Length == 3 && parts[1].Equals("parameters"))
                {
                    SwaggerParameter p = null;
                    if (parameters.TryGetValue(parts[2], out p))
                    {
                        return p;
                    }
                }
            }

            return null;
        }
    }
}