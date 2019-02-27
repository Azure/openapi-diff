﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.Swagger.Model;
using OpenApiDiff.Core;
using System.Collections.Generic;

namespace AutoRest.Swagger
{
    public class SwaggerModeler
    {
        /// <summary>
        /// Copares two versions of the same service specification.
        /// </summary>
        /// <returns></returns>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1506:AvoidExcessiveClassCoupling")]
        public IEnumerable<ComparisonMessage> Compare(string swaggerPrevious, string swaggerNew, Settings settings = null)
        {
            var oldDefintion = SwaggerParser.Parse(swaggerPrevious);
            var newDefintion = SwaggerParser.Parse(swaggerNew);

            var context = new ComparisonContext<ServiceDefinition>(oldDefintion.Typed, newDefintion.Typed, settings);

            var comparisonMessages = newDefintion.Typed.Compare(context, oldDefintion.Typed);

            return comparisonMessages;
        }
    }
}
