// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.Swagger;
using System;
using OpenApiDiff.Core;
using OpenApiDiff.Properties;
using System.IO;
using System.Linq;

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
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return 1;
            }

            var modeler = new SwaggerModeler();

            var swaggerPrev = File.ReadAllText(settings.OldSpec);
            var swaggerNew = File.ReadAllText(settings.NewSpec);

            var messages = modeler.Compare(
                settings.OldSpec,
                swaggerPrev, 
                settings.NewSpec, 
                swaggerNew,
                settings
            );

            if (settings.JsonValidationMessages)
            {
                Console.WriteLine("[");
                Console.WriteLine(string.Join(",\n", messages.Select(v => v.GetValidationMessagesAsJson())));
                Console.WriteLine("]");
            }
            else
            {
                foreach (var msg in messages)
                {
                    Console.WriteLine(msg.ToString());
                }
            }

            return 0;
        }
    }
}