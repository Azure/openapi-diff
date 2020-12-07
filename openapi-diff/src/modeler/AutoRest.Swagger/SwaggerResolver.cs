﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using AutoRest.Swagger.Model;

namespace AutoRest.Swagger
{
    /// <summary>
    /// Methods for normalizing and evaluating swagger schemas in their context in a swagger spec
    /// </summary>
    public class SchemaResolver
    {
        private const int MaximumReferenceDepth = 40;
        private readonly ServiceDefinition _serviceDefinition;


        /// <summary>
        /// Create a new schema resolver in the context of the given swagger spec
        /// </summary>
        /// <param name="modeler">The swagger spec modeler</param>
        public SchemaResolver(ServiceDefinition definition)
        {
            _serviceDefinition = definition;
        }

        /// <summary>
        /// Copy the current context - used to maintain the schema evaluation context when following 
        /// multiple chains of schema references.
        /// </summary>
        /// <returns>A schema resolver at the same depth as the current resolver.</returns>
        public object Clone()
        {
            var resolver = new SchemaResolver(_serviceDefinition);
            return resolver;
        }

        /// <summary>
        /// Normalize a swagger schema by dereferencing schema references and evaluating 
        /// schema composition
        /// </summary>
        /// <param name="schema">The schema to normalize</param>
        /// <returns>A normalized swagger schema</returns>
        public Schema Unwrap(Schema schema)
        {
            if (schema == null)
            {
                return null;
            }
            Schema unwrappedSchema = schema;
            // If referencing global definitions serializationProperty
            if (schema.Reference != null)
            {
                unwrappedSchema = Dereference(schema.Reference);
            }

            ExpandAllOf(unwrappedSchema);
            return unwrappedSchema;
        }

        /// <summary>
        /// Evaluate the composition of properties for a swagger spec and save the 
        /// evaluated form in the specification.  This transformation is idempotent
        /// </summary>
        /// <param name="schema">The swagger schema to evaluate.</param>
        public void ExpandAllOf(Schema schema)
        {
            if (schema == null)
            {
                throw new ArgumentNullException("schema");
            }

            if (schema.AllOf != null)
            {
                CheckCircularAllOf(schema, null, null);
                var references = schema.AllOf.Where(s => s.Reference != null).ToList();

                var propertiesOnlySchema = new Schema
                {
                    Properties =
                        schema.Properties
                };

                var schemaList =
                    new List<Schema>().Concat(schema.AllOf)
                        .Concat(new List<Schema> { propertiesOnlySchema });
                schema.Properties = new Dictionary<string, Schema>();
                foreach (var componentSchema in schemaList)
                {
                    // keep the same resolver state for each of the children
                    var unwrappedComponent = ((SchemaResolver)Clone()).Unwrap(
                        componentSchema);
                    if (unwrappedComponent != null && unwrappedComponent.Properties != null)
                    {
                        foreach (var propertyName in unwrappedComponent.Properties.Keys)
                        {
                            var unwrappedProperty = unwrappedComponent.Properties[propertyName];
                            if (schema.Properties.ContainsKey(propertyName))
                            {
                                if (!SchemaTypesAreEquivalent(
                                    schema.Properties[propertyName], unwrappedProperty))
                                {
                                    throw new InvalidOperationException(
                                        string.Format(CultureInfo.InvariantCulture,
                                        Properties.Resources.IncompatibleTypesInSchemaComposition,
                                            propertyName,
                                            unwrappedComponent.Properties[propertyName].Type,
                                            schema.Properties[propertyName].Type,
                                            schema.Title));
                                }
                            }
                            else
                            {
                               schema.Properties[propertyName] = unwrappedProperty;
                            }
                        }
                    }
                    if (unwrappedComponent != null && unwrappedComponent.Required != null)
                    {
                        var requiredProperties = schema.Required ?? new List<string>();
                        foreach (var requiredProperty in unwrappedComponent.Required)
                        {
                            if (!requiredProperties.Contains(requiredProperty))
                            {
                                requiredProperties.Add(requiredProperty);
                            }
                        }

                        schema.Required = requiredProperties;
                    }
                }

                schema.AllOf = null;
            }
        }

        void CheckCircularAllOf(Schema schema, HashSet<Schema> visited, Stack<string> referenceChain)
        {
            visited = visited ?? new HashSet<Schema>();
            referenceChain = referenceChain ?? new Stack<string>();
            if (!visited.Add(schema)) // was already present in the set
            {
                var setDescription = "(" + String.Join(", ", referenceChain) + ")";
                throw new InvalidOperationException(
                    string.Format(CultureInfo.InvariantCulture,
                    Properties.Resources.CircularBaseSchemaSet, setDescription));
            }

            if (schema.AllOf != null)
            {
                foreach (var reference in schema.AllOf.Select(s => s.Reference).Where(r => r != null))
                {
                    referenceChain.Push(reference);

                    var deref = Dereference(reference);
                    CheckCircularAllOf(deref, visited, referenceChain);

                    Debug.Assert(reference == referenceChain.Peek());
                    referenceChain.Pop();
                }
            }
            visited.Remove(schema);
        }

        /// <summary>
        /// Determine equivalence between the types described by two schemas. 
        /// Limit the comparison to exclude comparison of complexe inline schemas.
        /// </summary>
        /// <param name="parentProperty"></param>
        /// <param name="unwrappedProperty"></param>
        /// <returns></returns>
        private bool SchemaTypesAreEquivalent(Schema parentProperty,
            Schema unwrappedProperty)
        {
            Debug.Assert(parentProperty != null && unwrappedProperty != null);
            if (parentProperty == null)
            {
                throw new ArgumentNullException("parentProperty");
            }

            if (unwrappedProperty == null)
            {
                throw new ArgumentNullException("unwrappedProperty");
            }

            if ((parentProperty.Type == null || parentProperty.Type == DataType.Object) &&
                (unwrappedProperty.Type == null || unwrappedProperty.Type == DataType.Object))
            {
                var parentPropertyToCompare = parentProperty;
                var unwrappedPropertyToCompare = unwrappedProperty;
                if (!string.IsNullOrEmpty(parentProperty.Reference))
                {
                    parentPropertyToCompare = Dereference(parentProperty.Reference);
                }
                if (!string.IsNullOrEmpty(unwrappedProperty.Reference))
                {
                    unwrappedPropertyToCompare = Dereference(unwrappedProperty.Reference);
                }

                if (parentPropertyToCompare == unwrappedPropertyToCompare)
                {
                    return true; // when fully dereferenced, they can refer to the same thing
                }

                // or they can refer to different things... but there can be an inheritance relation...
                while (unwrappedPropertyToCompare != null && unwrappedPropertyToCompare.Extends != null)
                {
                    unwrappedPropertyToCompare = Dereference(unwrappedPropertyToCompare.Extends);
                    if (unwrappedPropertyToCompare == parentPropertyToCompare)
                    {
                        return true;
                    }
                }

                return false;
            }
            if (parentProperty.Type == DataType.Array &&
                unwrappedProperty.Type == DataType.Array)
            {
                return SchemaTypesAreEquivalent(parentProperty.Items, unwrappedProperty.Items);
            }
            return parentProperty.Type == unwrappedProperty.Type
                   && parentProperty.Format == unwrappedProperty.Format;
        }

        /// <summary>
        /// Determine whether a given property is defined in the referenced schema or its ancestors. 
        /// Return the property schema if it is defined, or null if not.
        /// </summary>
        /// <param name="reference">A reference to a schema</param>
        /// <param name="propertyName">The property to search for</param>
        /// <returns></returns>
        public Schema FindProperty(string reference, string propertyName)
        {
            Schema returnedSchema = null;
            if (reference != null)
            {
                Schema parentSchema = Dereference(reference);
                returnedSchema = FindProperty(parentSchema, propertyName);
            }

            return returnedSchema;
        }

        /// <summary>
        /// Determine whether a given property is defined in the schema or its ancestors. 
        /// Return the property schema if it is defined, or null if not.
        /// </summary>
        /// <param name="schema">A schema</param>
        /// <param name="propertyName">The property to search for</param>
        /// <returns></returns>
        public Schema FindProperty(Schema schema, string propertyName)
        {
            Schema returnedSchema = null;
            ExpandAllOf(schema);
            if (schema.Properties != null &&
                schema.Properties.ContainsKey(propertyName))
            {
                returnedSchema = schema.Properties[propertyName];
            }
            else
            {
                returnedSchema = FindProperty(schema.Extends, propertyName);
            }

            return returnedSchema;
        }

        /// <summary>
        /// Dereference a schema reference, with guards to prevent following circular reference chains
        /// </summary>
        /// <param name="referencePath">The schema reference to dereference.</param>
        /// <returns>The dereferenced schema.</returns>
        private Schema Dereference(string referencePath)
        {
            var vistedReferences = new List<string>();
            return DereferenceInner(referencePath, vistedReferences);
        }

        private string StripDefinitionPath(string referencePath)
        {
            var parts = referencePath.Split('/');
            if (parts.Length == 3 && parts[1].Equals("definitions"))
            {
                return parts[2];
            }
            return null;
        }

        private Schema DereferenceInner(string referencePath, List<string> visitedReferences)
        {
            // Check if external reference
            string[] splitReference = referencePath.Split(new[] { '#' }, StringSplitOptions.RemoveEmptyEntries);
            if (splitReference.Length == 2)
            {
                referencePath = "#" + splitReference[1];
            }

            if (visitedReferences.Contains(referencePath.ToUpperInvariant()))
            {
                throw new ArgumentException(string.Format(CultureInfo.InvariantCulture,
                    Properties.Resources.CircularReference, referencePath));
            }

            if (visitedReferences.Count >= MaximumReferenceDepth)
            {
                throw new ArgumentException(Properties.Resources.ExceededMaximumReferenceDepth, referencePath);
            }
            visitedReferences.Add(referencePath.ToUpperInvariant());
            var definitions = _serviceDefinition.Definitions;
            if (definitions == null || !definitions.ContainsKey(StripDefinitionPath(referencePath)))
            {
                throw new ArgumentException(string.Format(CultureInfo.InvariantCulture,
                    Properties.Resources.ReferenceDoesNotExist,
                    StripDefinitionPath(referencePath)));
            }

            var schema = definitions[StripDefinitionPath(referencePath)];
            if (schema.Reference != null)
            {
                schema = DereferenceInner(schema.Reference, visitedReferences);
            }

            return schema;
        }
    }
}