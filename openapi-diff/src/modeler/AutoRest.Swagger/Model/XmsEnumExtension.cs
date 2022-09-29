// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel;

namespace AutoRest.Swagger.Model
{
    /// <summary>
    /// The object provides metadata about the API. 
    /// The metadata can be used by the clients if needed, and can be presented 
    /// in the Swagger-UI for convenience.
    /// </summary>
    
    public class XmsEnumValue
    {
        public dynamic value;
        public string description;
        public string name;
    }

    public class XmsEnumExtension 
    {
        public string Name { get; set; }

        [DefaultValue(true)]
        [JsonProperty(DefaultValueHandling = DefaultValueHandling.Populate)]
        public Boolean ModelAsString { get; set; }

        public IList<XmsEnumValue> values { get; set; }
    }
}