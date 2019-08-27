// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using AutoRest.Swagger.Model;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using OpenApiDiff.Core;

namespace AutoRest.Swagger
{
    public static class SwaggerParser
    {
        public static JsonDocument<ServiceDefinition> Parse(string swaggerDocument, string fileName)
        {
            swaggerDocument = extractCommonParameters(swaggerDocument);
            var raw = JToken.Parse(swaggerDocument);
            return raw.ToJsonDocument(
                raw.ToObject<ServiceDefinition>(new JsonSerializer 
                {
                    MetadataPropertyHandling = MetadataPropertyHandling.Ignore,
                }),
                fileName
            );
        }

        // To extract the common parameters directly defined under {path}, and merge it with all operations parameters
        private static string extractCommonParameters(string json)
        {
            JObject obj = JObject.Parse(json);
            var paths = (JObject) obj["paths"];
            const string PATH_PARAMETERS_KEY = "parameters";
            bool changed = false;
            if(paths != null)
            {
                foreach (var path in paths)
                {
                    if (path.Value[PATH_PARAMETERS_KEY] != null)
                    {
                        changed = true;
                        var paras = path.Value.Value<JArray>(PATH_PARAMETERS_KEY);
                        foreach (var operation in (JObject)path.Value)
                        {
                            if (operation.Key == PATH_PARAMETERS_KEY) continue;
                            if (operation.Value[PATH_PARAMETERS_KEY] == null)
                            {
                                operation.Value[PATH_PARAMETERS_KEY] = new JArray();
                            }
                            foreach (var para in paras)
                            {
                                // Add common parameters to all operations only when they are not already defined in operations
                                var operationParaArray = ((JArray)operation.Value[PATH_PARAMETERS_KEY]);
                                if (para["name"] != null)
                                {
                                    string name = para.Value<string>("name");

                                    bool alreadyExist = false;

                                    foreach (var p in operationParaArray)
                                    {
                                        if (p["name"] != null && p.Value<string>("name") == name)
                                        {
                                            alreadyExist = true;
                                            break;
                                        }
                                    }

                                    if (!alreadyExist)
                                    {
                                        operationParaArray.Add(para);
                                    }
                                }
                                else if (para["$ref"] != null)
                                {
                                    string reference = para.Value<string>("$ref");

                                    bool alreadyExist = false;

                                    foreach (var p in operationParaArray)
                                    {
                                        if (p["$ref"] != null && p.Value<string>("name") == reference)
                                        {
                                            alreadyExist = true;
                                            break;
                                        }
                                    }

                                    if (!alreadyExist)
                                    {
                                        operationParaArray.Add(para);
                                    }
                                }

                            }
                        }
                        ((JObject)path.Value).Remove(PATH_PARAMETERS_KEY);
                    }
                }
            }
            
            return changed ? obj.ToString() : json;
        }
    }
}
