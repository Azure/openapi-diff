// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.Swagger;
using System;
using OpenApiDiff.Core;
using OpenApiDiff.Properties;
using System.IO;
using System.Net.Http;

namespace OpenApiDiff
{
    internal class Program
    {
        private static int Main(string[] args)
        {
            var settings = Settings.GetInstance(args);

            if (settings.ShowHelp)
            {
                Console.WriteLine(HelpGenerator.Generate(Resources.HelpTextTemplate, settings));
                return 0;
            }

            try
            {
                settings.Validate();
            } catch(Exception ex)
            {
                Console.WriteLine(ex.Message);
                return 1;
            }

            var modeler = new SwaggerModeler();

            var swaggerPrev = GetOpenApiSpec(settings.OldSpec);
            var swaggerNew = GetOpenApiSpec(settings.NewSpec);

            var messages = modeler.Compare(swaggerPrev, swaggerNew, settings);
            foreach (var msg in messages)
            {
                Console.WriteLine(settings.JsonValidationMessages ? msg.GetValidationMessagesAsJson() : msg.ToString());
            }

            return 0;
        }


        private static string GetOpenApiSpec(Uri uri)
        {
            if (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
            {
                using (var client = new HttpClient())
                {
                    var response = client.GetAsync(uri).Result;
                    return response.Content.ReadAsStringAsync().Result;
                }
            }

            if (uri.Scheme == Uri.UriSchemeFile)
            {
                return File.ReadAllText(uri.AbsolutePath);
            }

            // unsupported Uri scheme
            throw new NotImplementedException($"Given Uri scheme ({uri.Scheme}) is not supported yet.");
        }
    }
}