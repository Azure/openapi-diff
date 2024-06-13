// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Linq;
using System.Collections.Generic;

using Newtonsoft.Json;

namespace AutoRest.Swagger.Model
{
    /// <summary>
    /// Swagger schema object.
    /// </summary>
    public class Schema : SwaggerObject<Schema>
    {
        public string Title { get; set; }

        /// <summary>
        /// Adds support for polymorphism. The discriminator is the schema 
        /// property serviceTypeName that is used to differentiate between other schemas 
        /// that inherit this schema. The property serviceTypeName used MUST be defined 
        /// at this schema and it MUST be in the required property list. When used, 
        /// the value MUST be the serviceTypeName of this schema or any schema that inherits it,
        /// or it can be overridden with the x-ms-discriminator-value extension.
        /// </summary>
        public string Discriminator { get; set; }

        /// <summary>
        /// Key is a type serviceTypeName.
        /// </summary>
        public Dictionary<string, Schema> Properties { get; set; }

        public bool ReadOnly { get; set; }

        public ExternalDoc ExternalDocs { get; set; }

        public object Example { get; set; }

        /// <summary>
        /// The value of this property MUST be another schema which will provide 
        /// a base schema which the current schema will inherit from.  The
        /// inheritance rules are such that any instance that is valid according
        /// to the current schema MUST be valid according to the referenced
        /// schema.  This MAY also be an array, in which case, the instance MUST
        /// be valid for all the schemas in the array.  A schema that extends
        /// another schema MAY define additional attributes, constrain existing
        /// attributes, or add other constraints.
        /// </summary>
        public string Extends { get; set; }

        //For now (till the PBI gets addressed for the refactoring work), a generic field is used
        //for the reason that SwaggerParameter inherits from this class, but per spec, it's 'IsRequired' 
        //field should be boolean, not an array.
        public IList<string> Required { get; set; }

        /// <summary>
        /// Defines the set of schemas this shema is composed of
        /// </summary>
        public IList<Schema> AllOf { get; set; }

        [JsonIgnore]
        internal bool IsReferenced { get; set; }

        private DataDirection _compareDirection = DataDirection.None;

        private LinkedList<Schema> _visitedSchemas = new LinkedList<Schema>();

        /// <inheritdoc />
        /// <summary>
        /// Compare a modified document node (this) to a previous one and look for breaking as well as non-breaking changes.
        /// </summary>
        /// <param name="context">The modified document context.</param>
        /// <param name="previous">The original document model.</param>
        /// <returns>A list of messages from the comparison.</returns>
        public override IEnumerable<ComparisonMessage> Compare(
            ComparisonContext<ServiceDefinition> context,
            Schema previous
        )
        {
            var priorSchema = previous;
            if (priorSchema == null)
            {
                throw new ArgumentNullException("priorVersion");
            }
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }



            int referenced = 0;

            var thisSchema = this;

            if (!string.IsNullOrWhiteSpace(thisSchema.Reference))
            {
                thisSchema = FindReferencedSchema(thisSchema.Reference, context.CurrentRoot.Definitions);
                referenced += 1;
                if (thisSchema == null)
                {
                    return context.Messages;
                }
            }
            if (!string.IsNullOrWhiteSpace(priorSchema.Reference))
            {
                priorSchema = FindReferencedSchema(priorSchema.Reference, context.PreviousRoot.Definitions);
                referenced += 1;
                if (priorSchema == null)
                {
                    return context.Messages;
                }
            }

            var thisModelName = thisSchema.XmsClientName ?? Reference ?? "";
            var priorModelName = priorSchema.XmsClientName ?? previous.Reference ?? "";
            if (!thisModelName.Equals(priorModelName))
            {
                context.LogBreakingChange(ComparisonMessages.ReferenceRedirection);
            }

            // Avoid doing the comparison repeatedly by marking for which direction it's already been done.

            if (context.Direction != DataDirection.None && referenced == 2)
            {
                // Comparing two referenced schemas in the context of a parameter or response -- did we already do this?

                if (thisSchema._compareDirection == context.Direction || thisSchema._compareDirection == DataDirection.Both)
                {
                    return new ComparisonMessage[0];
                }
                _compareDirection |= context.Direction;
            }

            if (thisSchema != this || priorSchema != previous)
            {
                if (_visitedSchemas.Contains(priorSchema))
                {
                    return context.Messages;
                }
                _visitedSchemas.AddFirst(priorSchema);
                return thisSchema.Compare(context, priorSchema);
            }

            base.Compare(context, previous);

            if (priorSchema.ReadOnly != ReadOnly)
            {
                context.LogBreakingChange(ComparisonMessages.ReadonlyPropertyChanged, priorSchema.ReadOnly.ToString().ToLower(), ReadOnly.ToString().ToLower());
            }

            if ((priorSchema.Discriminator == null && Discriminator != null) ||
                (priorSchema.Discriminator != null && !priorSchema.Discriminator.Equals(Discriminator)))
            {
                context.LogBreakingChange(ComparisonMessages.DifferentDiscriminator);
            }

            if ((priorSchema.Extends == null && Extends != null) ||
                (priorSchema.Extends != null && !priorSchema.Extends.Equals(Extends)))
            {
                context.LogBreakingChange(ComparisonMessages.DifferentExtends);
            }

            if ((priorSchema.AllOf == null && AllOf != null) ||
                (priorSchema.AllOf != null && AllOf == null))
            {
                context.LogBreakingChange(ComparisonMessages.DifferentAllOf);
            }
            else if (priorSchema.AllOf != null)
            {
                CompareAllOfs(context, priorSchema);
            }

            // Compare each properties of the model
            context.PushProperty("properties");
            CompareProperties(context, priorSchema);
            context.Pop();

            // Compare `required` list of properties of the model
            CompareRequired(context, priorSchema);

            return context.Messages;
        }

        /// <summary>
        /// Compares list of required properties of this (i.e. "new") model to the previous (i.e. "old") model.
        ///
        /// If the new model has new required properties that are not readOnly, it is a breaking change.
        /// In case there are any issues with property definitions, like:
        /// - properties being listed as required but not actually defined,
        /// - or properties changing their read-only status.
        /// Then we conservatively also treat such cases as breaking changes.
        ///
        /// Related:
        /// https://stackoverflow.com/questions/40113049/how-to-specify-if-a-field-is-optional-or-required-in-openapi-swagger
        /// https://github.com/Azure/azure-sdk-tools/issues/7184
        /// </summary>
        /// <param name="context">Comparison Context</param>
        /// <param name="priorSchema">Schema of the old model</param>
        private void CompareRequired(ComparisonContext<ServiceDefinition> context, Schema priorSchema)
        {
            // If Required list is null then no properties are required in the new model,
            // so there are no breaking changes.
            if (Required == null)
            {
                return;
            }

            List<string> newRequiredNonReadOnlyPropNames = new List<string>();
            foreach (string requiredPropName in Required)
            {
                Properties.TryGetValue(requiredPropName, out Schema propSchema);
                priorSchema.Properties.TryGetValue(requiredPropName, out Schema priorPropSchema);
                if (propSchema is null || priorPropSchema is null)
                {
                    // If propSchema is null then the property is marked as required but not actually defined in the model.
                    // This is a model definition issue and we report it.
                    // If priorPropSchema is null then the property was not actually defined in the old model,
                    // so we conservatively assume it is a newly required property, even if the old model
                    // listed this not-then-defined property as required (which would be the old model definition issue).
                    newRequiredNonReadOnlyPropNames.Add(requiredPropName);
                    break;
                }

                bool propWasRequired = priorSchema.Required?.Contains(requiredPropName) == true;
                // Note that property is considered read-only only if it is consistently read-only both in the old and new models.
                bool propIsReadOnly = propSchema.ReadOnly && priorPropSchema.ReadOnly;
                if (!propWasRequired && !propIsReadOnly)
                {
                    // Property is newly required and it is not read-only, hence it is a breaking change.
                    newRequiredNonReadOnlyPropNames.Add(requiredPropName);
                }
            }

            if (newRequiredNonReadOnlyPropNames.Any())
            {
                context.LogBreakingChange(ComparisonMessages.AddedRequiredProperty, string.Join(", ", newRequiredNonReadOnlyPropNames));
            }
        }

        private void CompareAllOfs(ComparisonContext<ServiceDefinition> context, Schema priorSchema)
        {
            var different = 0;
            foreach (var schema in priorSchema.AllOf)
            {
                if (!AllOf.Select(s => s.Reference).ToArray().Contains(schema.Reference))
                {
                    different += 1;
                }
            }
            foreach (var schema in AllOf)
            {
                if (!priorSchema.AllOf.Select(s => s.Reference).ToArray().Contains(schema.Reference))
                {
                    different += 1;
                }
            }

            if (different > 0)
            {
                context.LogBreakingChange(ComparisonMessages.DifferentAllOf);
            }
        }

        /// <summary>
        /// Comapres properties of the previous Schema to detect removed / added required properties
        /// </summary>
        /// <param name="context">Comaprision Context</param>
        /// <param name="priorSchema">Schema of the old model</param>
        private void CompareProperties(ComparisonContext<ServiceDefinition> context, Schema priorSchema)
        {
            // Case: Were any properties removed?
            if (priorSchema.Properties != null)
            {
                foreach (var def in priorSchema.Properties)
                {
                    if (Properties == null || !Properties.TryGetValue(def.Key, out var model))
                    {
                        context.LogBreakingChange(ComparisonMessages.RemovedProperty, def.Key);
                    }
                    else
                    {
                        // required to optional
                        if (Required != null && Required.Contains(def.Key) && (priorSchema.Required == null || !priorSchema.Required.Contains(def.Key)))
                        {
                            context.LogBreakingChange(ComparisonMessages.RequiredStatusChange, false, true);
                        }

                        // optional to required
                        if ((Required == null || !Required.Contains(def.Key)) && (priorSchema.Required != null && priorSchema.Required.Contains(def.Key)))
                        {
                            context.LogBreakingChange(ComparisonMessages.RequiredStatusChange, true, false);
                        }

                        context.PushProperty(def.Key);
                        model.Compare(context, def.Value);
                        context.Pop();
                    }
                }
            }

            // Case: Were any properties added?
            if (Properties != null)
            {
                foreach (KeyValuePair<string, Schema> property in Properties)
                {
                    // Case: Were any required properties added?
                    if (priorSchema.Properties == null || !priorSchema.Properties.TryGetValue(property.Key, out var model))
                    {
                        if ((Required != null && Required.Contains(property.Key)))
                        {
                            context.LogBreakingChange(ComparisonMessages.AddedRequiredProperty, property.Key);
                        }
                        else if (context.Direction == DataDirection.Response && property.Value != null)
                        {
                            if (property.Value.ReadOnly == true)
                                context.LogInfo(ComparisonMessages.AddedReadOnlyPropertyInResponse, property.Key);
                            else
                                context.LogBreakingChange(ComparisonMessages.AddedPropertyInResponse, property.Key);
                        }
                        else if(IsReferenced && property.Value != null)
                        {
                            context.LogBreakingChange(ComparisonMessages.AddedOptionalProperty, property.Key);
                        }
                    }
                }
            }
        }

        public static Schema FindReferencedSchema(string reference, IDictionary<string, Schema> definitions)
        {
            if (reference != null && reference.StartsWith("#", StringComparison.Ordinal))
            {
                var parts = reference.Split('/');
                if (parts.Length == 3 && parts[1].Equals("definitions"))
                {
                    if (definitions.TryGetValue(parts[2], out var p))
                    {
                        return p;
                    }
                }
            }

            return null;
        }
    }
}
