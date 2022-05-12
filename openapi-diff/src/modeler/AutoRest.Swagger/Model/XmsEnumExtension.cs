// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;

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
        public XmsEnumValue(dynamic v)
        {
            value = v;
        }

        public static explicit operator XmsEnumValue(int v) => new XmsEnumValue(v);
        public static explicit operator XmsEnumValue(long v) => new XmsEnumValue(v);
        public static explicit operator XmsEnumValue(string v) => new XmsEnumValue(v);
    }

    public class XmsEnumExtension
    {
        public string Name { get; set; }

        public Boolean ModelAsString { get; set; }

        public IList<XmsEnumValue> values { get; set; }
    }
}