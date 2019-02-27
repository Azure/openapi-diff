// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using AutoRest.Swagger.Model;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AutoRest.Swagger
{
    public static class SwaggerParser
    {
        class ObjectConverter : JsonConverter
        {
            public override bool CanConvert(Type objectType) => false;

            public override object ReadJson(
                JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer
            ) => existingValue;

            public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
            {
            }
        }

        public static ServiceDefinition Parse(string swaggerDocument)
        {
            var raw = JToken.Parse(swaggerDocument);
            var converters = new JsonConverterCollection { };
            converters.Add(new ObjectConverter());
            return raw.ToObject<ServiceDefinition>(JsonSerializer.Create(new JsonSerializerSettings
            {
                Converters = converters,
                MetadataPropertyHandling = MetadataPropertyHandling.Ignore,
            }));
            /*
            return JsonConvert.DeserializeObject<ServiceDefinition>(swaggerDocument, new JsonSerializerSettings
            {
                MetadataPropertyHandling = MetadataPropertyHandling.Ignore
            });
            */
        }
    }
}
