// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.Swagger;
using System;
using OpenApiDiff.Core;
using OpenApiDiff.Properties;
using System.IO;

namespace OpenApiDiff
{
    internal class Program
    {
        private static int Main(string[] args)
        {
            Settings settings = Settings.GetInstance(args);

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

            SwaggerModeler modeler = new SwaggerModeler();

            string swaggerPrev = File.ReadAllText(settings.OldSpec);
            string swaggerNew = File.ReadAllText(settings.NewSpec);

            var messages = modeler.Compare(
                settings.OldSpec,
                swaggerPrev, 
                settings.NewSpec, 
                swaggerNew,
                settings
            );
            foreach (var msg in messages)
            {
                Console.WriteLine(settings.JsonValidationMessages ? msg.GetValidationMessagesAsJson() : msg.ToString());
            }

            return 0;
        }
    }
}