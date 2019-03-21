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
            var raw = JToken.Parse(swaggerDocument);
            return raw.ToJsonDocument(
                raw.ToObject<ServiceDefinition>(new JsonSerializer 
                {
                    MetadataPropertyHandling = MetadataPropertyHandling.Ignore,
                }),
                fileName
            );
        }
    }
}
