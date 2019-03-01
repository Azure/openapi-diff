﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Linq;
using System.Text.RegularExpressions;
using YamlDotNet.RepresentationModel;

namespace OpenApiDiff.Core.Logging
{
    public class ObjectPathPartProperty : ObjectPathPart
    {
        // conservative approximation
        private static readonly Regex regexValidES3DotNotationPropertyName = new Regex(@"^(?!do|if|in|for|int|new|try|var|byte|case|char|else|enum|goto|long|null|this|true|void|with|break|catch|class|const|false|final|float|short|super|throw|while|delete|double|export|import|native|public|return|static|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)[a-zA-Z_][a-zA-Z_0-9]*$");

        public ObjectPathPartProperty(string property)
        {
            Property = property;
        }

        public string Property { get; }

        public override string JsonPointer(JToken _) => $"/{Property.Replace("~", "~0").Replace("/", "~1")}";
    }
}
