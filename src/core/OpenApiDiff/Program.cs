// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.Swagger;
using System;
using System.IO;

namespace OpenApiDiff
{
    internal class Program
    {
        private static int Main(string[] args)
        {
            var modeler = new SwaggerModeler();

            var swaggerPrev = File.ReadAllText(args[0]);
            var swaggerNew = File.ReadAllText(args[1]);
            foreach (var message in modeler.Compare(swaggerPrev, swaggerNew))
            {
                Console.WriteLine(message.Message);
            }

            Console.ReadKey();
            return 0;
        }
    }
}