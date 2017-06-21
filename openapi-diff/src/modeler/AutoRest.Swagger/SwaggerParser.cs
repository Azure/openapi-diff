// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.Swagger.Model;
using Newtonsoft.Json;

namespace AutoRest.Swagger
{
    public static class SwaggerParser
    {
        public static ServiceDefinition Parse(string swaggerDocument)
        {
            return JsonConvert.DeserializeObject<ServiceDefinition>(swaggerDocument, new JsonSerializerSettings
            {
                MetadataPropertyHandling = MetadataPropertyHandling.Ignore
            });
        }
    }
}
