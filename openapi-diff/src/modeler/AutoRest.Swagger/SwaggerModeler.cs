// Copyright (c) Microsoft Corporation. All rights reserved.
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
        /// <param name="fileNameOld">a file name of the old swagger document</param>
        /// <param name="swaggerOld">a content of the old swagger document</param>
        /// <param name="fileNameNew">a file name of the new swagger document</param>
        /// <param name="swaggerNew">a content of the new swagger document</param>
        /// <returns></returns>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Maintainability", "CA1506:AvoidExcessiveClassCoupling")]
        public IEnumerable<ComparisonMessage> Compare(
            string fileNameOld,
            string swaggerOld,
            string fileNameNew,
            string swaggerNew,
            Settings settings = null
        )
        {
            var oldDefintion = SwaggerParser.Parse(swaggerOld, fileNameOld);
            var newDefintion = SwaggerParser.Parse(swaggerNew, fileNameNew);

            var context = new ComparisonContext<ServiceDefinition>(oldDefintion, newDefintion, settings);

            var comparisonMessages = newDefintion.Typed.Compare(context, oldDefintion.Typed);

            return comparisonMessages;
        }
    }
}
