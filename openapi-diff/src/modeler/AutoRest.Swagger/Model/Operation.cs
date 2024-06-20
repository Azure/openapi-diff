// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
using System;
using System.Linq;
using System.Collections.Generic;

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
            Operation priorOperation = previous;

            if (priorOperation == null)
            {
                throw new ArgumentException("previous");
            }

            base.Compare(context, previous);

            if (OperationId != priorOperation.OperationId)
            {
                context.LogBreakingChange(ComparisonMessages.ModifiedOperationId, priorOperation.OperationId, OperationId);
            }
            Extensions.TryGetValue("x-ms-long-running-operation", out var currentLongRunningOperationValue);
            priorOperation.Extensions.TryGetValue("x-ms-long-running-operation", out var priorLongRunningOperationValue);

            currentLongRunningOperationValue = currentLongRunningOperationValue ?? false;
            priorLongRunningOperationValue = priorLongRunningOperationValue ?? false;
            if (!currentLongRunningOperationValue.Equals(priorLongRunningOperationValue))
            {
                context.LogBreakingChange(ComparisonMessages.XmsLongRunningOperationChanged);
            }

            CheckParameters(context, priorOperation);

            // Check that all the request body formats that were accepted still are.

            context.PushProperty("consumes");
            foreach (var format in priorOperation.Consumes)
            {
                if (!Consumes.Contains(format))
                {
                    context.LogBreakingChange(ComparisonMessages.RequestBodyFormatNoLongerSupported, format);
                }
            }
            context.Pop();

            // Check that all the response body formats were also supported by the old version.

            context.PushProperty("produces");
            foreach (var format in Produces)
            {
                if (!priorOperation.Produces.Contains(format))
                {
                    context.LogBreakingChange(ComparisonMessages.ResponseBodyFormatNowSupported, format);
                }
            }
            context.Pop();

            if (Responses != null && priorOperation.Responses != null)
            {
                context.PushProperty("responses");
                foreach (var response in Responses)
                {
                    var oldResponse = priorOperation.FindResponse(response.Key);

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
                    var newResponse = this.FindResponse(response.Key);

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

        // kja todo
        /// <summary>
        /// Check that no parameters were removed or reordered, and compare them if it's not the case
        /// </summary>
        /// <param name="context">Comparison Context</param>
        /// <param name="priorOperation">Operation object of old swagger</param>
        private void CheckParameters(ComparisonContext<ServiceDefinition> context, Operation priorOperation)
        {
            ServiceDefinition currentRoot = context.CurrentRoot;
            ServiceDefinition previousRoot = context.PreviousRoot;

            context.PushProperty("parameters");

            List<SwaggerParameter> currParamsResolved =
                Parameters.Select(param => ResolveParam(param, currentRoot)).ToList();

            List<SwaggerParameter> priorParamsResolved =
                priorOperation.Parameters.Select(param => ResolveParam(param, previousRoot)).ToList();

            DetectChangedParameterOrder(context, currParamsResolved, priorParamsResolved);

            foreach (SwaggerParameter oldParam in priorParamsResolved)
            {
                SwaggerParameter newParam = FindParameterEx(oldParam, Parameters, currentRoot.Parameters);

                // we should use PushItemByName instead of PushProperty because Swagger `parameters` is
                // an array of parameters.
                context.PushItemByName(oldParam.Name);

                if (newParam != null)
                {
                    newParam.Compare(context, oldParam);
                }
                else if (oldParam.IsRequired)
                {
                    // Removed required parameter
                    context.LogBreakingChange(ComparisonMessages.RemovedRequiredParameter, oldParam.Name);
                } else {
                    // Removed optional parameter
                    context.LogBreakingChange(ComparisonMessages.RemovedOptionalParameter, oldParam.Name);
                }

                context.Pop();
            }

            // Check that no required or optional parameters were added.
            List<SwaggerParameter> allParameters = Parameters.Select(
                    param =>
                        string.IsNullOrWhiteSpace(param.Reference)
                            ? param
                            : FindReferencedParameter(param.Reference, currentRoot.Parameters))
                .Where(p => p != null).ToList();

            foreach (SwaggerParameter newParam in allParameters)
            {
                SwaggerParameter oldParam = FindParameterEx(newParam, priorOperation.Parameters, previousRoot.Parameters);

                if (oldParam != null)
                    continue;

                // Did not find required parameter in the old swagger i.e. required parameter is added
                context.PushItemByName(newParam.Name);

                context.LogBreakingChange(
                    newParam.IsRequired
                        ? ComparisonMessages.AddingRequiredParameter
                        : ComparisonMessages.AddingOptionalParameter,
                    newParam.Name);

                context.Pop();
            }
            context.Pop();
        }

        private static SwaggerParameter ResolveParam(SwaggerParameter param, ServiceDefinition serviceDef)
            => string.IsNullOrWhiteSpace(param.Reference)
                ? param
                : FindReferencedParameter(param.Reference, serviceDef.Parameters);

        private void DetectChangedParameterOrder(
            ComparisonContext<ServiceDefinition> context,
            List<SwaggerParameter> currParamsResolved,
            List<SwaggerParameter> priorParamsResolved)
        {
            // To detect which parameters order change has caused breaking change we first must
            // filter out all parameters whose order does not matter.
            // Once we filter out such parameters, we can determine order change by comparing
            // position index of all the remaining parameters. Without such pre-filtering this would
            // throw off computations.
            //
            // For an example, consider following params:
            // [Foo, Bar, Qux]
            // whose order changed to
            // [Foo, Qux, Bar].
            // In such case if the order of "Foo" and "Bar" matters
            // but the order of "Qux" does not matter,
            // then there is no breaking change here, because "Bar" correctly remains
            // *after* "Foo" param.
            //
            // We uniquely identify a parameter by the unique pair of its properties: "Name" and "In".

            for (int i = 0; i < currParamsResolved.Count; i++)
            {
                SwaggerParameter currParam = Parameters.ElementAt(i);
                SwaggerParameter currParamResolved = currParamsResolved.ElementAt(i);
                currParamResolved.Extensions.TryGetValue("x-ms-parameter-location", out object curParameterLocation);
                if (
                    !string.IsNullOrWhiteSpace(currParam.Reference) &&
                    (curParameterLocation == null || !curParameterLocation.Equals("method"))
                )
                {
                    // If the parameter is a Reference then we assume it is a global parameter.
                    // If the global parameter definition does not declare "x-ms-parameter-location"
                    // then we assume it defaults to "client" and so its order does not matter.
                    // If the global parameter definition declares "x-ms-parameter-location" 
                    // to any value different from "method", then we assume its order does not matter.
                    // When we assume the parameter order does not matter, then we continue
                    // here to avoid checking for ordering change.
                    // Read more at:
                    // https://github.com/Azure/azure-sdk-tools/issues/7170#issuecomment-2162156876
                    continue;
                }
                int priorIndex = FindParameterIndex(currParamResolved, priorParamsResolved);
                if (priorIndex != -1 && priorIndex != i)
                {
                    context.LogBreakingChange(ComparisonMessages.ChangedParameterOrder, currParamResolved.Name);
                }
            }
        }

        /// <summary>
        /// Finds given parameter in the list of operation parameters or global parameters
        /// </summary>
        /// <param name="parameter">the parameter to search</param>
        /// <param name="operationParameters">list of operation parameters to search</param>
        /// <param name="clientParameters">Dictionary of global parameters to search</param>
        /// <returns>Swagger Parameter if found; otherwise null</returns>
        private SwaggerParameter FindParameterEx(
            SwaggerParameter parameter,
            IList<SwaggerParameter> operationParameters,
            IDictionary<string, SwaggerParameter> clientParameters)
        {
            if (Parameters != null)
            {
                // first try to find the param has same 'name' and 'in'
                foreach (SwaggerParameter param in operationParameters)
                {
                    if (parameter.Name.Equals(param.Name) && parameter.In.Equals(param.In))
                        return param;

                    var pRef = FindReferencedParameter(param.Reference, clientParameters);

                    if (pRef != null && parameter.Name.Equals(pRef.Name) && parameter.In.Equals(pRef.In))
                    {
                        return pRef;
                    }
                }
            }
            
            // then try to find the parameter has same 'name'
            return FindParameter(parameter.Name, operationParameters, clientParameters);
        }

        /// <summary>
        /// Finds give parameter name in the list of operation parameters or global parameters
        /// </summary>
        /// <param name="name">name of the parameter to search</param>
        /// <param name="operationParameters">list of operation parameters to search</param>
        /// <param name="clientParameters">Dictionary of global parameters to search</param>
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

        private int FindParameterIndex(SwaggerParameter parameter, IList<SwaggerParameter> @params)
        {
            for (int i = 0; i < @params.Count; i++)
            {
                if (@params.ElementAt(i).Name == parameter.Name && @params.ElementAt(i).In == parameter.In)
                {
                    return i;
                }
            }
            return -1;
        }

        private OperationResponse FindResponse(string name)
        {
            Responses.TryGetValue(name, out var response);
            return response;
        }

        /// <summary>
        /// Finds referenced parameter
        /// </summary>
        /// <param name="reference">Name of the reference to search for. Expected to be in format of #/parameters/{paramName}</param>
        /// <param name="parameters">Dictionary of parameters for the search. Expected to be keyed with {paramName}s</param>
        /// <returns>Swagger Parameter if found; otherwise null</returns>
        private static SwaggerParameter FindReferencedParameter(
            string reference,
            IDictionary<string, SwaggerParameter> parameters)
        {
            if (reference != null && reference.StartsWith("#", StringComparison.Ordinal))
            {
                string[] parts = reference.Split('/');
                if (parts.Length == 3 && parts[1].Equals("parameters"))
                {
                    if (parameters.TryGetValue(parts[2], out var param))
                    {
                        return param;
                    }
                    else
                    {
                        // Given the parameter reference of form
                        // #/parameters/<paramName>
                        // the parameter named <paramName> could not be found in the "parameters"
                        // input to this method.
                        // Silently ignoring that param reference by doing nothing here.
                    }
                }
                else
                {
                    // The parameter reference does not conform to the format of: 
                    // #/parameters/<paramName>
                    // because it has different number of elements or its second element is not "parameters".
                    // Silently ignoring that param reference by doing nothing here.
                }
            }
            else
            {
                // The reference is null or does not start with "#".
                // Silently ignoring it by doing nothing here.
            }

            return null;
        }
    }
}