// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using AutoRest.Swagger.Model;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using OpenApiDiff.Core;
using AutoRest.Swagger.JsonConverters;

namespace AutoRest.Swagger
{
    public static class SwaggerParser
    {
        public static JsonDocument<ServiceDefinition> Parse(string swaggerDocument, string fileName)
        {
            var settings = new JsonSerializerSettings
            {
                TypeNameHandling = TypeNameHandling.None,
                MetadataPropertyHandling = MetadataPropertyHandling.Ignore
            };
            settings.Converters.Add(new PathLevelParameterConverter(swaggerDocument));

            var raw = JToken.Parse(swaggerDocument);

            var swagger = JsonConvert.DeserializeObject<ServiceDefinition>(swaggerDocument, settings);

            return raw.ToJsonDocument(
               swagger,
               fileName
           );
        }
    }
}
