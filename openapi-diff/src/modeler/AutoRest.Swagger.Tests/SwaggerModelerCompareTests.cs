// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.IO;
using System.Linq;
using Xunit;
using System.Collections.Generic;
using OpenApiDiff.Core.Logging;
using System.Reflection;

namespace AutoRest.Swagger.Tests
{
    /// <summary>
    /// This class contains tests for the logic comparing two swagger specifications,
    /// an older version against newer version.
    ///
    /// For all but the tests that verify that version checks are done properly, the
    /// old and new specifications have the same version number, which should force
    /// the comparison logic to produce errors rather than warnings for each breaking
    /// change.
    ///
    /// Non-breaking changes are always presented as informational messages, regardless
    /// of whether the version has changed or not.
    /// </summary>
    [Collection("Comparison Tests")]
    public class SwaggerModelerCompareTests
    {
        /// <summary>
        /// Helper method -- load two Swagger documents and invoke the comparison logic.
        /// </summary>
        /// <param name="input">The name of the swagger document file. The file name must be the same in both the 'modified' and 'original' folder.</param>
        /// <returns>A list of messages from the comparison logic.</returns>
        private ComparisonMessagesV2 CompareSwagger(string input)
        {
            var modeler = new SwaggerModeler();
            var baseDir = Directory.GetParent(typeof(SwaggerModelerCompareTests).GetTypeInfo().Assembly.Location.ToString()).ToString();
            return modeler.Compare(
                File.ReadAllText(Path.Combine(baseDir, "Resource", "Swagger", "old", input)),
                File.ReadAllText(Path.Combine(baseDir, "Resource", "Swagger", "new", input))
            );
        }

        /// <summary>
        /// Verifies that not raising the version number results in a strict comparison.
        /// </summary>
        [Fact]
        public void SameMajorVersionNumberStrict()
        {
            var messages = CompareSwagger("version_check_02.json");
            Assert.True(
                messages.Additions.Warnings.Count == 0 && 
                messages.Removals.Warnings.Count == 0 && 
                messages.Updates.Warnings.Count == 0);
        }

        /// <summary>
        /// Verifies that lowering the version number results in an error.
        /// </summary>
        [Fact]
        public void ReversedVersionNumberChange()
        {
            var messages = CompareSwagger("version_check_04.json");
            Assert.True(messages.Updates.Errors.Count == 1);
            Assert.True(messages.Updates.Errors[0].Id == ComparisonMessages.VersionsReversed.Id);
        }

        /// <summary>
        /// Verifies that if you remove a supported request body format, it's caught.
        /// </summary>
        [Fact]
        public void RequestFormatMissing()
        {
            var messages = CompareSwagger("misc_checks_01.json");
            Assert.True(messages.Removals.Errors.Count > 0);
            var missing = messages.Removals.Errors.Where(m => m.Id == ComparisonMessages.RequestBodyFormatNoLongerSupported.Id);
            Assert.NotEmpty(missing);
        }

        /// <summary>
        /// Verifies that if you add an expected response body format, it's caught.
        /// </summary>
        [Fact]
        public void ResponseFormatAdded()
        {
            var messages = CompareSwagger("misc_checks_01.json");
            Assert.True(messages.Additions.Errors.Count > 0);
            var added = messages.Additions.Errors.Where(m => m.Id == ComparisonMessages.ResponseBodyFormatNowSupported.Id);
            Assert.NotEmpty(added);
        }

        /// <summary>
        /// Verifies that if you remove a schema, it's caught.
        /// </summary>
        [Fact]
        public void DefinitionRemoved()
        {
            var messages = CompareSwagger("removed_definition.json");
            Assert.True(messages.Removals.Errors.Count > 0);
            var missing = messages.Removals.Errors.Where(m => m.Id == ComparisonMessages.RemovedDefinition.Id);
            Assert.NotEmpty(missing);
        }

        /// <summary>
        /// Verifies that if you change the type of a schema property, it's caught.
        /// </summary>
        [Fact]
        public void PropertyTypeChanged()
        {
            var messages = CompareSwagger("type_changed.json");
            Assert.True(messages.Updates.Errors.Count > 0);
            var missing = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.TypeChanged.Id);
            Assert.NotEmpty(missing);
            var error = missing.Where(err => err.Path.JsonReference.StartsWith("#/definitions/")).FirstOrDefault();
            Assert.NotNull(error);
            Assert.Equal("#/definitions/Database/properties/a", error.Path.JsonReference);
        }

        /// <summary>
        /// Verifies that if you change the type format of a schema property, it's caught.
        /// </summary>
        [Fact]
        public void PropertyTypeFormatChanged()
        {
            var messages = CompareSwagger("misc_checks_01.json");
            var missing = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.TypeFormatChanged.Id);
            Assert.NotEmpty(missing);
            var error = missing.Where(err => err.Path.JsonReference.StartsWith("#/definitions/")).FirstOrDefault();
            Assert.NotNull(error);
            Assert.Equal("#/definitions/Database/properties/c", error.Path.JsonReference);
        }

        /// <summary>
        /// Verifies that if you remove a schema that isn't used, it's not flagged.
        /// </summary>
        [Fact]
        public void UnreferencedDefinitionRemoved()
        {
            var messages = CompareSwagger("misc_checks_02.json");
            Assert.Empty(messages.Additions.Errors.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Unreferenced")));
            Assert.Empty(messages.Additions.Info.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Unreferenced")));
            Assert.Empty(messages.Additions.Warnings.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Unreferenced")));
            Assert.Empty(messages.Removals.Errors.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Unreferenced")));
            Assert.Empty(messages.Removals.Info.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Unreferenced")));
            Assert.Empty(messages.Removals.Warnings.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Unreferenced")));
            Assert.Empty(messages.Updates.Errors.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Unreferenced")));
            Assert.Empty(messages.Updates.Info.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Unreferenced")));
            Assert.Empty(messages.Updates.Warnings.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Unreferenced")));
        }

        /// <summary>
        /// Verifies that if you change the type of a schema property of a schema that isn't referenced, it's not flagged.
        /// </summary>
        [Fact]
        public void UnreferencedTypeChanged()
        {
            var messages = CompareSwagger("misc_checks_02.json");
            Assert.Empty(messages.Additions.Errors.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Database")));
            Assert.Empty(messages.Additions.Info.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Database")));
            Assert.Empty(messages.Additions.Warnings.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Database")));
            Assert.Empty(messages.Removals.Errors.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Database")));
            Assert.Empty(messages.Removals.Info.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Database")));
            Assert.Empty(messages.Removals.Warnings.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Database")));
            Assert.Empty(messages.Updates.Errors.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Database")));
            Assert.Empty(messages.Updates.Info.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Database")));
            Assert.Empty(messages.Updates.Warnings.Where(m => m.Id > 0 && m.Path.JsonReference.StartsWith("#/definitions/Database")));
        }

        /// <summary>
        /// Verifies that if you remove (or rename) a path, it's caught.
        /// </summary>
        [Fact]
        public void PathRemoved()
        {
            var messages = CompareSwagger("removed_path.json");
            var missing = messages.Removals.Errors.Where(m => m.Id == ComparisonMessages.RemovedPath.Id);
            Assert.Equal(2, missing.Count());
            Assert.NotEmpty(missing.Where(m => m.Path.ReadablePath == "#/paths/api/Parameters/{a}"));
            Assert.NotEmpty(missing.Where(m => m.Path.ReadablePath == "#/paths/api/Responses"));
        }

        /// <summary>
        /// Verifies that if you remove an operation, it's caught.
        /// </summary>
        [Fact]
        public void OperationRemoved()
        {
            var messages = CompareSwagger("removed_operation.json");
            var missing = messages.Removals.Errors.Where(m => m.Id == ComparisonMessages.RemovedOperation.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Path.ReadablePath == "#/paths/api/Operations"));
        }

        /// <summary>
        /// Verifies that if you change the operations id for a path, it's caught.
        /// </summary>
        [Fact]
        public void OperationIdChanged()
        {
            var messages = CompareSwagger("changed_operation_id.json");
            var missing = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.ModifiedOperationId.Id);
            Assert.Equal(2, missing.Count());
            Assert.NotEmpty(missing.Where(m => m.Path.ReadablePath == "#/paths/api/Paths/get"));
            Assert.NotEmpty(missing.Where(m => m.Path.ReadablePath == "#/paths/api/Operations/post"));
        }

        /// <summary>
        /// Verifies that if you added new paths / operations, it's caught.
        /// </summary>
        [Fact]
        public void AddedPaths()
        {
            var messages = CompareSwagger("added_path.json");
            var missing = messages.Additions.Info.Where(m => m.Id == ComparisonMessages.AddedPath.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Path.ReadablePath == "#/paths/api/Paths"));

            missing = messages.Additions.Info.Where(m => m.Id == ComparisonMessages.AddedOperation.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Path.ReadablePath == "#/paths/api/Operations/post"));
        }

        /// <summary>
        /// Verifies that if you remove a required parameter, it's found.
        /// </summary>
        [Fact]
        public void RequiredParameterRemoved()
        {
            var messages = CompareSwagger("required_parameter.json");
            var missing = messages.Removals.Errors.Where(m => m.Id == ComparisonMessages.RemovedRequiredParameter.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Path.ReadablePath == "#/paths/api/Parameters/{a}/get/f"));
        }

        /// <summary>
        /// Verifies that if you add a required property in the model, it's found.
        /// </summary>
        [Fact]
        public void AddedRequiredProperty()
        {
            var messages = CompareSwagger("added_required_property.json");
            var missing = messages.Additions.Errors.Where(m => m.Id == ComparisonMessages.AddedRequiredProperty.Id);
            Assert.Equal(2, missing.Count());
            var error = missing.First();
            Assert.Equal("#/paths/api/Parameters/put/database", error.Path.ReadablePath);
        }

        /// <summary>
        /// Verifies that if you remove a required request header, it's found.
        /// </summary>
        [Fact]
        public void RequiredRequestHeaderRemoved()
        {
            var messages = CompareSwagger("operation_check_03.json");
            var missing = messages.Removals.Errors.Where(m => m.Id == ComparisonMessages.RemovedRequiredParameter.Id);
            Assert.NotEmpty(missing);
            var error = missing.First();
            Assert.Equal("#/paths/~1api~1Parameters/get/x-ar", error.Path.JsonReference);
        }

        /// <summary>
        /// Verifies that if you add a required parameter, it is flagged
        /// </summary>
        [Fact]
        public void RequiredParameterAdded()
        {
            var messages = CompareSwagger("required_parameter.json");
            var missing = messages.Additions.Errors.Where(m => m.Id == ComparisonMessages.AddingRequiredParameter.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Path.ReadablePath == "#/paths/api/Parameters/{a}/get/g"));
        }

        /// <summary>
        /// Verifies that if you add a new readOnly property in the response model, it is flagged as info
        /// </summary>
        [Fact]
        public void ReadonlyPropertyInResponse()
        {
            var messages = CompareSwagger("readonly_changes.json");
            var missing = messages.Additions.Info.Where(m => m.Id == ComparisonMessages.AddedReadOnlyPropertyInResponse.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Path.ReadablePath == "#/paths/subscriptions/{subscriptionId}/providers/Microsoft.Storage/checkNameAvailability/post/200/properties"));
        }

        /// <summary>
        /// Verifies that if you add a new property in the response model, it is flagged as info
        /// </summary>
        [Fact]
        public void AddedPropertyInResponse()
        {
            var messages = CompareSwagger("added_property_in_response.json");
            var missing = messages.Additions.Errors.Where(m => m.Id == ComparisonMessages.AddedPropertyInResponse.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Path.ReadablePath == "#/paths/subscriptions/{subscriptionId}/providers/Microsoft.Storage/checkNameAvailability/post/200/properties"));
        }

        /// <summary>
        /// Verifies that rules work on the recurive models
        /// </summary>
        [Fact]
        public void RecursiveModels()
        {
            var messages = CompareSwagger("recursive_model.json");
            var missing = messages.Removals.Errors.Where(m => m.Id == ComparisonMessages.RemovedProperty.Id);
            Assert.Equal(2, missing.Count());
            missing = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.ReadonlyPropertyChanged.Id);
            Assert.Equal(2, missing.Count());
        }

        /// <summary>
        /// Verifies that if you add a required request header, it is flagged
        /// </summary>
        [Fact]
        public void RequiredRequestHeaderAdded()
        {
            var messages = CompareSwagger("operation_check_03.json");
            var missing = messages.Additions.Errors.Where(m => m.Id == ComparisonMessages.AddingRequiredParameter.Id);
            Assert.NotEmpty(missing);
            var error = missing.First();
            Assert.Equal("#/paths/~1api~1Parameters/get/x-cr", error.Path.JsonReference);
        }

        /// <summary>
        /// Verifies that if you change where a parameter is passed, it is flagged.
        /// </summary>
        [Fact]
        public void ParameterMoved()
        {
            var messages = CompareSwagger("operation_check_01.json");
            var missing = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.ParameterInHasChanged.Id);
            Assert.NotEmpty(missing);
            var error = missing.First();
            Assert.Equal("#/paths/~1api~1Parameters~1{a}/get/b", error.Path.JsonReference);
        }

        /// <summary>
        /// Verifies that if you make a required parameter optional, it's flagged, but not as an error.
        /// </summary>
        [Fact]
        public void ParameterStatusLess()
        {
            var messages = CompareSwagger("required_parameter.json");
            var missing = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.RequiredStatusChange.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Path.ReadablePath == "#/paths/api/Parameters/{a}/get/e"));
        }

        /// <summary>
        /// Verifieds that if you make an optional parameter required, it's caught.
        /// </summary>
        [Fact]
        public void ParameterStatusMore()
        {
            var messages = CompareSwagger("operation_check_01.json");
            var missing = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.RequiredStatusChange.Id);
            Assert.NotEmpty(missing);
            Assert.NotEmpty(missing.Where(m => m.Path.JsonReference == "#/paths/~1api~1Parameters~1{a}/get/e"));
        }

        /// <summary>
        /// If a parameter used to be constant (only had one valid value), but is changed to take more than one
        /// value, then it should be flagged.
        /// </summary>
        [Fact]
        public void ParameterConstantChanged()
        {
            var messages = CompareSwagger("operation_check_01.json");
            var missing = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.ConstantStatusHasChanged.Id);
            Assert.NotEmpty(missing);
            Assert.NotEmpty(missing.Where(m => m.Path.JsonReference == "#/paths/~1api~1Parameters~1{a}/get/f"));
        }

        /// <summary>
        /// Just changing the name of a parameter schema in the definitions section does not change the wire format for
        /// the parameter, so it shouldn't result in a separate error for the parameter.
        /// </summary>
        [Fact]
        public void ParameterSchemaNameChanged()
        {
            var messages = CompareSwagger("operation_check_02.json");
            var redirected = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.ReferenceRedirection.Id);
            Assert.Empty(redirected);
        }

        /// <summary>
        /// Just changing the name of a parameter schema in the definitions section does not change the wire format for
        /// the parameter, so it shouldn't result in a separate error for the parameter.
        /// </summary>
        [Fact]
        public void ParameterSchemaContentsChanged()
        {
            var messages = CompareSwagger("operation_check_02.json");
            var changed = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.TypeChanged.Id);
            Assert.NotEmpty(changed);
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/paths/~1api~1Parameters/post/registry/properties/b"));
        }

        /// <summary>
        /// Verify that removing a response code is flagged.
        /// </summary>
        [Fact]
        public void ResponseRemoved()
        {
            var messages = CompareSwagger("operation_check_01.json");
            var removed = messages.Removals.Errors.Where(m => m.Id == ComparisonMessages.RemovedResponseCode.Id);
            Assert.NotEmpty(removed);
            Assert.NotEmpty(removed.Where(m => m.Path.JsonReference == "#/paths/~1api~1Responses/get/200"));            
        }

        /// <summary>
        /// Verify that adding a response code is flagged.
        /// </summary>
        [Fact]
        public void ResponseAdded()
        {
            var messages = CompareSwagger("operation_check_01.json");
            var removed = messages.Additions.Errors.Where(m => m.Id == ComparisonMessages.AddingResponseCode.Id);
            Assert.NotEmpty(removed);
            Assert.NotEmpty(removed.Where(m => m.Path.JsonReference == "#/paths/~1api~1Responses/get/202"));
        }

        /// <summary>
        /// Verify that changing the type of a response code is flagged.
        /// </summary>
        [Fact]
        public void ResponseTypeChanged()
        {
            var messages = CompareSwagger("operation_check_01.json");
            var removed = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.TypeChanged.Id);
            Assert.Equal(2, removed.Count());
            Assert.NotEmpty(removed.Where(m => m.Path.JsonReference == "#/paths/~1api~1Responses/get/201"));
            Assert.NotEmpty(removed.Where(m => m.Path.JsonReference == "#/paths/~1api~1Responses/get/400/properties/id"));
        }

        /// <summary>
        /// Verify that changing the $ref-referenced type of a response code is flagged.
        /// </summary>
        [Fact]
        public void ResponseSchemaChanged()
        {
            var messages = CompareSwagger("operation_check_02.json");
            var removed = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.TypeChanged.Id && m.Path.JsonReference.Contains("Responses"));
            Assert.Single(removed);
            Assert.NotEmpty(removed.Where(m => m.Path.JsonReference == "#/paths/~1api~1Responses/get/400/properties/id"));
        }

        /// <summary>
        /// Verify that adding headers to a response definition is flagged.
        /// </summary>
        [Fact]
        public void ResponseHeaderAdded()
        {
            var messages = CompareSwagger("operation_check_03.json");
            var added = messages.Additions.Info.Where(m => m.Id == ComparisonMessages.AddingHeader.Id);
            Assert.Single(added);
            Assert.NotEmpty(added.Where(m => m.Path.JsonReference == "#/paths/~1api~1Responses/get/200/x-c"));
        }

        /// <summary>
        /// Verify that removing headers from a response definition is flagged.
        /// </summary>
        [Fact]
        public void ResponseHeaderRemoved()
        {
            var messages = CompareSwagger("operation_check_03.json");
            var removed = messages.Removals.Errors.Where(m => m.Id == ComparisonMessages.RemovingHeader.Id);
            Assert.Single(removed);
            Assert.NotEmpty(removed.Where(m => m.Path.JsonReference == "#/paths/~1api~1Responses/get/200/x-a"));
        }

        /// <summary>
        /// Verify that removing headers from a response definition is flagged.
        /// </summary>
        [Fact]
        public void ResponseHeaderTypeChanged()
        {
            var messages = CompareSwagger("operation_check_03.json");
            var changed = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.TypeChanged.Id && m.Path.JsonReference.Contains("Responses"));
            Assert.Single(changed);
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/paths/~1api~1Responses/get/200/x-b"));
        }

        /// <summary>
        /// Verifies that changing the collection format for an array parameter is flagged.
        /// Direction: requests
        /// </summary>
        [Fact]
        public void RequestArrayFormatChanged()
        {
            var messages = CompareSwagger("operation_check_04.json");
            var changed = messages.Updates.Errors.Where(m => m.Path.JsonReference.Contains("Parameters") && m.Id == ComparisonMessages.ArrayCollectionFormatChanged.Id);
            Assert.Equal(4, changed.Count());
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/paths/~1api~1Parameters/get/a"));
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/paths/~1api~1Parameters/get/b"));
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/paths/~1api~1Parameters/put/a/properties/a"));
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/paths/~1api~1Parameters/put/a/properties/b"));
        }

        /// <summary>
        /// Verifies that making constraints stricter in requests are flagged as errors and that relaxed constraints
        /// are just informational.
        /// </summary>
        [Fact]
        public void RequestTypeConstraintsChanged()
        {
            var messages = CompareSwagger("operation_check_04.json");
            var stricter = messages.Updates.Errors.Where(m => m.Path.JsonReference.Contains("Parameters") && m.Id == ComparisonMessages.ConstraintIsStronger.Id);
            var breaking = messages.Updates.Errors.Where(m => m.Path.JsonReference.Contains("Parameters") && m.Id == ComparisonMessages.ConstraintChanged.Id);
            var info = messages.Updates.Info.Where(m => m.Path.JsonReference.Contains("Parameters") && m.Id > 0);

            Assert.Equal(11, stricter.Count());
            Assert.Equal(8, breaking.Count());
            Assert.Equal(13, info.Count());
        }

        /// <summary>
        /// Verifies that changing the collection format for an array parameter is flagged.
        /// Direction: responses
        /// </summary>
        [Fact]
        public void ResponseArrayFormatChanged()
        {
            var messages = CompareSwagger("operation_check_05.json");
            var changed = messages.Updates.Errors.Where(m => m.Path.JsonReference.Contains("Responses") && m.Id == ComparisonMessages.ArrayCollectionFormatChanged.Id);
            Assert.Equal(4, changed.Count());
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/paths/~1api~1Responses/get/200/properties/a"));
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/paths/~1api~1Responses/get/200/properties/b"));
        }

        /// <summary>
        /// Verifies that, in responses, relaxed constraints are errors while stricter constraints are informational.
        /// </summary>
        [Fact]
        public void ResponseTypeConstraintsChanged()
        {
            var messages = CompareSwagger("operation_check_05.json");
            var relaxed = messages.Updates.Errors.Where(m => m.Path.JsonReference.Contains("Responses") && m.Id == ComparisonMessages.ConstraintIsWeaker.Id);
            var breaking = messages.Updates.Errors.Where(m => m.Path.JsonReference.Contains("Responses") && m.Id == ComparisonMessages.ConstraintChanged.Id);
            var info = messages.Updates.Info.Where(m => m.Path.JsonReference.Contains("Responses") && m.Id > 0).ToArray();

            Assert.Equal(13, relaxed.Count());
            Assert.Equal(8, breaking.Count());
            Assert.Equal(11, info.Count());
        }

        /// <summary>
        /// Verifies that changing the collection format for an array parameter is flagged.
        /// Direction: requests
        /// </summary>
        [Fact]
        public void GobalParamArrayFormatChanged()
        {
            var messages = CompareSwagger("param_check_01.json");
            var changed = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.ArrayCollectionFormatChanged.Id);
            Assert.Equal(6, changed.Count());
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/parameters/a"));
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/parameters/b"));
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/parameters/e/properties/a"));
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/parameters/e/properties/b"));
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/definitions/A/properties/a"));
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/definitions/A/properties/b"));
        }

        /// <summary>
        /// Verifies that making constraints stricter in requests are flagged as errors and that relaxed constraints
        /// are just informational.
        /// </summary>
        [Fact]
        public void GobalParamTypeConstraintsChanged()
        {
            var messages = CompareSwagger("param_check_01.json");
            var stricter = messages.Updates.Errors.Where(m => m.Path.JsonReference.Contains("parameters") && m.Id == ComparisonMessages.ConstraintIsStronger.Id);
            var breaking = messages.Updates.Errors.Where(m => m.Path.JsonReference.Contains("parameters") && m.Id == ComparisonMessages.ConstraintChanged.Id);
            var info = messages.Updates.Info.Where(m => m.Path.JsonReference.Contains("parameters") && m.Id > 0);

            Assert.Equal(11, stricter.Count());
            Assert.Equal(8, breaking.Count());
            Assert.Equal(15, info.Count());
        }

        /// <summary>
        /// Verifies that changing the collection format for an array parameter is flagged.
        /// Direction: responses
        /// </summary>
        [Fact]
        public void GobalResponseArrayFormatChanged()
        {
            var messages = CompareSwagger("response_check_01.json");
            var changed = messages.Updates.Errors.Where(m => m.Id == ComparisonMessages.ArrayCollectionFormatChanged.Id);
            Assert.Equal(6, changed.Count());
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/responses/200/properties/a"));
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/responses/200/properties/b"));
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/responses/201/properties/a"));
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/responses/201/properties/b"));
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/definitions/A/properties/a"));
            Assert.NotEmpty(changed.Where(m => m.Path.JsonReference == "#/definitions/A/properties/b"));
        }

        /// <summary>
        /// Verifies that, in global responses, relaxed constraints are errors while stricter constraints are informational.
        /// </summary>
        [Fact]
        public void GlobalResponseTypeConstraintsChanged()
        {
            var messages = CompareSwagger("response_check_01.json");
            var relaxed = messages.Updates.Errors.Where(m => m.Path.JsonReference.Contains("responses") && m.Id == ComparisonMessages.ConstraintIsWeaker.Id);
            var breaking = messages.Updates.Errors.Where(m => m.Path.JsonReference.Contains("responses") && m.Id == ComparisonMessages.ConstraintChanged.Id);
            var info = messages.Updates.Info.Where(m => m.Path.JsonReference.Contains("responses") && m.Id > 0);

            Assert.Equal(13, relaxed.Count());
            Assert.Equal(8, breaking.Count());
            Assert.Equal(13, info.Count());
        }

        [Fact]
        public void RemovedPropertyTest()
        {
            var messages = CompareSwagger("removed_property.json");
            var removed = messages.Removals.Errors.Where(m => m.Id == ComparisonMessages.RemovedProperty.Id);
            Assert.Equal(2, removed.Count());
        }
    }
}
