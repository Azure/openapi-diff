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

            List<(SwaggerParameter param, bool isGlobal)> currParamsResolved =
                Parameters.Select(param => ResolveParam(param, currentRoot)).ToList();

            List<(SwaggerParameter param, bool isGlobal)> priorParamsResolved =
                priorOperation.Parameters.Select(param => ResolveParam(param, previousRoot)).ToList();

            DetectChangedParameterLocation(context, currParamsResolved, priorParamsResolved);
            DetectChangedParameterOrder(context, currParamsResolved, priorParamsResolved);

            foreach (var paramInfo in priorParamsResolved)
            {
                (SwaggerParameter oldParam, bool _) = paramInfo;
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

        private static (SwaggerParameter param, bool isGlobal) ResolveParam(SwaggerParameter param, ServiceDefinition serviceDef)
            => string.IsNullOrWhiteSpace(param.Reference)
                ? (param, false)
                : (FindReferencedParameter(param.Reference, serviceDef.Parameters), true);

        /// <summary>
        /// Report breaking change if parameter location has changed.
        /// See "1050 - ParameterLocationHasChanged" in docs/rules/1050.md for details.
        ///
        /// Parameter location could have changed only if that parameter existed in the previous version and
        /// still exists in the new version.
        /// </summary>
        private void DetectChangedParameterLocation(
            ComparisonContext<ServiceDefinition> context,
            List<(SwaggerParameter param, bool isGlobal)> currParamsInfo,
            List<(SwaggerParameter param, bool isGlobal)> priorParamsInfo)
        {
            // kja WIP
            priorParamsInfo.ForEach(
                priorParamInfo
                    =>
                {
                    (SwaggerParameter param, bool isGlobal) matchingCurrParamInfo = currParamsInfo.FirstOrDefault(
                        currParamInfo => ParamsAreSame(currParamInfo.param, priorParamInfo.param));
                    if (matchingCurrParamInfo != default)
                    {
                        var priorLocationIsMethod = ParamLocationIsMethod(priorParamInfo);
                        var currLocationIsMethod = ParamLocationIsMethod(matchingCurrParamInfo);
                        if (priorLocationIsMethod ^ currLocationIsMethod)
                        {
                            context.LogBreakingChange(
                                ComparisonMessages.ParameterLocationHasChanged,
                                priorParamInfo.param.Name,
                                priorParamInfo.param.In,
                                priorLocationIsMethod,
                                currLocationIsMethod);
                        }
                    }
                    else
                    {
                        // The parameter existed in the previous version but does not exist in the new version
                        // hence its location could not have changed.
                    }
                });
        }

        /// <summary>
        /// This method reports breaking change on parameters whose order matters and it has changed.
        ///
        /// This method works by first filtering out all parameters whose order does not matter.
        /// To see how do we determine if parameter order matters, consult the ParamOrderMatters method.
        ///
        /// Once we have the collection of current and prior params whose order matters, we compare their order
        /// by index. If at any point current and prior params differ (see implementation of this method
        /// to see how we determine if two params differ), then we report a breaking change.
        ///
        /// If a new parameter, whose order matters, was added to current version, we will not report any
        /// breaking changes on it as it didn't exist before. However, its addition may still shift
        /// other parameters' order, and that will be reported as breaking change. E.g.:
        /// [Foo, Bar] -> [Qux, Foo, Bar]. // kja add test for this. And also for [Foo, Bar, Qux] where all orders matter.
        /// Here Qux has been added thus shifting Foo and Bar's order.
        ///
        /// If a parameter definition has changed in such a way that its order now matters, but previously
        /// it did not, then we will not report a ComparisonMessages.ChangedParameterOrder breaking change
        /// on that parameters, but we do expect a different breaking change will be reported by a different rule.
        /// This case can happen when parameter location was converted from "client" to "method".
        /// // kja add test for: params changed from "client" to "method". Also test for no ChangedParamOrder in it.
        /// 
        /// If a parameter definition has changed in such a way that its order previously mattered,
        /// but now it does not, then we will not report a ComparisonMessages.ChangedParameterOrder breaking change
        /// on that parameter, but we do expect a different breaking change will be reported by a different rule.
        /// This case can happen when parameter location was converted from "method" to "client".
        /// // kja add test for: params changed from "method" to "client". Also test for no ChangedParamOrder in it.
        /// 
        /// Additional context provided at:
        /// https://github.com/Azure/azure-sdk-tools/issues/7170#issuecomment-2162156876
        /// </summary>
        private void DetectChangedParameterOrder(
            ComparisonContext<ServiceDefinition> context,
            List<(SwaggerParameter param, bool isGlobal)> currParamsInfo,
            List<(SwaggerParameter param, bool isGlobal)> priorParamsInfo)
        {
            SwaggerParameter[] currParamsResolvedOrdered =
                currParamsInfo.Where(ParamOrderMatters).Select(paramInfo => paramInfo.param).ToArray();

            SwaggerParameter[] priorParamsResolvedOrdered =
                priorParamsInfo.Where(ParamOrderMatters).Select(paramInfo => paramInfo.param).ToArray();

            int currParamsCount = currParamsResolvedOrdered.Length;
            int priorParamsCount = priorParamsResolvedOrdered.Length;

            int paramIndex = 0;
            while (paramIndex < priorParamsCount)
            {
                SwaggerParameter currParamAtIndex =
                    paramIndex < currParamsCount ? currParamsResolvedOrdered[paramIndex] : null;
                SwaggerParameter priorParamAtIndex = priorParamsResolvedOrdered[paramIndex];

                if (!ParamsAreSame(currParamAtIndex, priorParamAtIndex))
                {
                    context.LogBreakingChange(
                        ComparisonMessages.ChangedParameterOrder,
                        priorParamAtIndex.Name,
                        priorParamAtIndex.In);
                }

                paramIndex++;
            }
        }

        /// <summary>
        /// Here we assume a parameter is uniquely identified by the pair of its properties : "Name" and "In".
        /// </summary>
        private static bool ParamsAreSame(SwaggerParameter currParam, SwaggerParameter priorParam)
            => currParam != null && priorParam != null && currParam.Name == priorParam.Name &&
               currParam.In == priorParam.In;

        /// <summary>
        /// We assume that parameter location is "method" if, and only if, its order matters.
        /// </summary>
        private bool ParamLocationIsMethod((SwaggerParameter param, bool isGlobal) paramInfo)
            => ParamOrderMatters(paramInfo);

        /// <summary>
        /// Determines if given parameter's order matters. See the comments within this method for details,
        /// as well as comment on DetectChangedParameterOrder method.
        /// </summary>
        private bool ParamOrderMatters((SwaggerParameter param, bool isGlobal) paramInfo)
        {
            if (!paramInfo.isGlobal)
            {
                // If the parameter is not a global parameter then we assume its order matters.
                // We assume this because we assume that the parameters are generated into C# code
                // via AutoRest implementation. According to this implementation example in [1],
                // these parameters are by default method parameters, hence their order matters.
                // We also assume, as explained in [2], that it is not possible to override parameter
                // location to one whose order doesn't matter: the extension "x-ms-parameter-location"
                // will be ignored even if defined.
                // [1] https://github.com/Azure /autorest/blob/765bc784b0cad173d47f931a04724936a6948b4c/docs/generate/how-autorest-generates-code-from-openapi.md#specifying-required-parameters-and-properties
                // [2] https://github.com/Azure/autorest/blob/765bc784b0cad173d47f931a04724936a6948b4c/docs/extensions/readme.md#x-ms-parameter-location
                return true;
            }

            paramInfo.param.Extensions.TryGetValue("x-ms-parameter-location", out object paramLocation);

            // Per [2], if the global parameter definition does not declare "x-ms-parameter-location"
            // then we assume it defaults to "client" and so its order does not matter.
            // If the global parameter definition declares "x-ms-parameter-location" 
            // to any value different from "method", then we assume its order does not matter.
            // Otherwise, parameter either is not a global parameter, or its "x-ms-parameter-location" key
            // is set to "method", hence its order matters.
            // [2] https://github.com/Azure/autorest/blob/765bc784b0cad173d47f931a04724936a6948b4c/docs/extensions/readme.md#x-ms-parameter-location
            return paramLocation != null && paramLocation.Equals("method");
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
