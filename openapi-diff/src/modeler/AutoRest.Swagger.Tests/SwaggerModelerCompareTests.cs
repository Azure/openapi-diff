// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.IO;
using System.Linq;
using Xunit;
using System.Collections.Generic;
using OpenApiDiff.Core.Logging;
using System.Reflection;
using Newtonsoft.Json;

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
        private IEnumerable<ComparisonMessage> CompareSwagger(string input)
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
            var messages = CompareSwagger("version_check_02.json").ToArray();
            Assert.Empty(messages.Where(m => m.Id > 0 && m.Severity == Category.Warning));
        }

        /// <summary>
        /// Verifies that lowering the version number results in an error.
        /// </summary>
        [Fact]
        public void ReversedVersionNumberChange()
        {
            var messages = CompareSwagger("version_check_04.json").ToArray();
            Assert.NotEmpty(messages.Where(m => m.Id > 0 && m.Severity >= Category.Error));
            var reversed = messages.Where(m => m.Id == ComparisonMessages.VersionsReversed.Id);
            Assert.NotEmpty(reversed);
            Assert.Equal(Category.Error, reversed.First().Severity);
        }

        /// <summary>
        /// Verifies that if you remove a supported request body format, it's caught.
        /// </summary>
        [Fact]
        public void RequestFormatMissing()
        {
            var messages = CompareSwagger("misc_checks_01.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.RequestBodyFormatNoLongerSupported.Id);
            Assert.NotEmpty(missing);
            Assert.Equal(Category.Error, missing.First().Severity);
        }

        /// <summary>
        /// Verifies that if you add an expected response body format, it's caught.
        /// </summary>
        [Fact]
        public void ResponseFormatAdded()
        {
            var messages = CompareSwagger("misc_checks_01.json").ToArray();
            var added = messages.Where(m => m.Id == ComparisonMessages.ResponseBodyFormatNowSupported.Id);
            Assert.NotEmpty(added);
            Assert.Equal(Category.Error, added.First().Severity);
        }

        /// <summary>
        /// Verifies that if you remove a schema, it's caught.
        /// </summary>
        [Fact]
        public void DefinitionRemoved()
        {
            var messages = CompareSwagger("removed_definition.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.RemovedDefinition.Id);
            Assert.NotEmpty(missing);
            Assert.Equal(Category.Error, missing.First().Severity);
        }

        /// <summary>
         /// Verifies that if you change the type of a schema property, it's caught.
         /// </summary>
        [Fact]
        public void PropertyTypeChanged()
        {
            var messages = CompareSwagger("type_changed.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.TypeChanged.Id);
            Assert.NotEmpty(missing);
            var error = missing.Where(err => err.NewJsonRef.StartsWith("#/definitions/")).FirstOrDefault();
            Assert.NotNull(error);
            Assert.Equal(Category.Error, error.Severity);
            Assert.Equal("#/definitions/Database/properties/a", error.NewJsonRef);
        }

        /// <summary>
        /// Verifies that if you change the type format of a schema property, it's caught.
        /// </summary>
        [Fact]
        public void PropertyTypeFormatChanged()
        {
            var messages = CompareSwagger("misc_checks_01.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.TypeFormatChanged.Id);
            Assert.NotEmpty(missing);
            var error = missing.Where(err => err.NewJsonRef.StartsWith("#/definitions/")).FirstOrDefault();
            Assert.NotNull(error);
            Assert.Equal(Category.Error, error.Severity);
            Assert.Equal("#/definitions/Database/properties/c", error.NewJsonRef);
        }

        /// <summary>
        /// Verifies that if you remove a schema that isn't used, it's not flagged.
        /// </summary>
        [Fact]
        public void UnreferencedDefinitionRemoved()
        {
            var messages = CompareSwagger("misc_checks_02.json").ToArray();
            var missing = messages.Where(m => m.Id > 0 && m.NewJsonRef.StartsWith("#/definitions/Unreferenced"));
            Assert.Empty(missing);
        }

        /// <summary>
        /// Verifies that if you change the type of a schema property of a schema that isn't referenced, it's not flagged.
        /// </summary>
        [Fact]
        public void UnreferencedTypeChanged()
        {
            var messages = CompareSwagger("misc_checks_02.json").ToArray();
            var missing = messages.Where(m => m.Id > 0 && m.NewJsonRef.StartsWith("#/definitions/Database"));
            Assert.Empty(missing);
        }

        /// <summary>
        /// Verifies that if you remove (or rename) a path, it's caught.
        /// </summary>
        [Fact]
        public void PathRemoved()
        {
            var messages = CompareSwagger("removed_path.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.RemovedPath.Id);
            Assert.Equal(2, missing.Count());
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Error && m.NewJsonRef == "#/paths/~1api~1Parameters~1{a}"));
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Error && m.NewJsonRef == "#/paths/~1api~1Responses"));
        }

        /// <summary>
        /// Verifies that if you remove an operation, it's caught.
        /// </summary>
        [Fact]
        public void OperationRemoved()
        {
            var messages = CompareSwagger("removed_operation.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.RemovedOperation.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Error && m.NewJsonRef == "#/paths/~1api~1Operations"));
        }

        /// <summary>
        /// Verifies that if you change the operations id for a path, it's caught.
        /// </summary>
        [Fact]
        public void OperationIdChanged()
        {
            var messages = CompareSwagger("changed_operation_id.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.ModifiedOperationId.Id);
            Assert.Equal(2, missing.Count());
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Error && m.NewJsonRef == "#/paths/~1api~1Paths/get"));
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Error && m.NewJsonRef == "#/paths/~1api~1Operations/post"));
            IJsonLineInfo current = messages[0].Old;
            IJsonLineInfo previous = messages[0].New;
        }

        /// <summary>
        /// Verifies that if you added new paths / operations, it's caught.
        /// </summary>
        [Fact]
        public void AddedPaths()
        {
            var messages = CompareSwagger("added_path.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.AddedPath.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Info && m.NewJsonRef == "#/paths/~1api~1Paths"));

            missing = messages.Where(m => m.Id == ComparisonMessages.AddedOperation.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Info && m.NewJsonRef == "#/paths/~1api~1Operations/post"));
        }

        /// <summary>
        /// Verifies that if you remove a required parameter, it's found.
        /// </summary>
        [Fact]
        public void RequiredParameterRemoved()
        {
            var messages = CompareSwagger("required_parameter.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.RemovedRequiredParameter.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Error && m.NewJsonRef == "#/paths/~1api~1Parameters~1{a}/get/parameters/f"));
        }

        /// <summary>
        /// Verifies that if you add a required property in the model, it's found.
        /// </summary>
        [Fact]
        public void AddedRequiredProperty()
        {
            var messages = CompareSwagger("added_required_property.json").ToArray();
            var missing = messages.Where(m => m.Severity == Category.Error && m.Id == ComparisonMessages.AddedRequiredProperty.Id);
            Assert.Equal(2, missing.Count());
            var error = missing.First();
            Assert.Equal("#/paths/~1api~1Parameters/put/parameters/database", error.NewJsonRef);
        }

        /// <summary>
        /// Verifies that if you remove a required request header, it's found.
        /// </summary>
        [Fact]
        public void RequiredRequestHeaderRemoved()
        {
            var messages = CompareSwagger("operation_check_03.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.RemovedRequiredParameter.Id);
            Assert.NotEmpty(missing);
            var error = missing.First();
            Assert.Equal(Category.Error, error.Severity);
            Assert.Equal("#/paths/~1api~1Parameters/get/parameters/x-ar", error.NewJsonRef);
        }


        /// <summary>
        /// Verifies that if you add a required parameter, it is flagged
        /// </summary>
        [Fact]
        public void RequiredParameterAdded()
        {
            var messages = CompareSwagger("required_parameter.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.AddingRequiredParameter.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Error && m.NewJsonRef == "#/paths/~1api~1Parameters~1{a}/get/parameters/g"));
        }

        /// <summary>
        /// Verifies that if you add a new readOnly property in the response model, it is flagged as info
        /// </summary>
        [Fact]
        public void ReadonlyPropertyInResponse()
        {
            var messages = CompareSwagger("readonly_changes.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.AddedReadOnlyPropertyInResponse.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Info && m.NewJsonRef == "#/paths/~1subscriptions~1{subscriptionId}~1providers~1Microsoft.Storage~1checkNameAvailability/post/200/properties"));
        }

        /// <summary>
        /// Verifies that if you add a new property in the response model, it is flagged as info
        /// </summary>
        [Fact]
        public void AddedPropertyInResponse()
        {
            var messages = CompareSwagger("added_property_in_response.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.AddedPropertyInResponse.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Error && m.NewJsonRef == "#/paths/~1subscriptions~1{subscriptionId}~1providers~1Microsoft.Storage~1checkNameAvailability/post/200/properties"));
        }

        /// <summary>
        /// Verifies that rules work on the recurive models
        /// </summary>
        [Fact]
        public void RecursiveModels()
        {
            var messages = CompareSwagger("recursive_model.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.RemovedProperty.Id);
            Assert.Equal(2, missing.Count());

            missing = messages.Where(m => m.Id == ComparisonMessages.ReadonlyPropertyChanged.Id);
            Assert.Equal(2, missing.Count());
        }

        /// <summary>
        /// Verifies that if you add a required request header, it is flagged
        /// </summary>
        [Fact]
        public void RequiredRequestHeaderAdded()
        {
            var messages = CompareSwagger("operation_check_03.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.AddingRequiredParameter.Id);
            Assert.NotEmpty(missing);
            var error = missing.First();
            Assert.Equal(Category.Error, error.Severity);
            Assert.Equal("#/paths/~1api~1Parameters/get/parameters/x-cr", error.NewJsonRef);
        }

        /// <summary>
        /// Verifies that if you change where a parameter is passed, it is flagged.
        /// </summary>
        [Fact]
        public void ParameterMoved()
        {
            var messages = CompareSwagger("operation_check_01.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.ParameterInHasChanged.Id);
            Assert.NotEmpty(missing);
            var error = missing.First();
            Assert.Equal(Category.Error, error.Severity);
            Assert.Equal("#/paths/~1api~1Parameters~1{a}/get/parameters/b", error.NewJsonRef);
        }

        /// <summary>
        /// Verifies that if you make a required parameter optional, it's flagged, but not as an error.
        /// </summary>
        [Fact]
        public void ParameterStatusLess()
        {
            var messages = CompareSwagger("required_parameter.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.RequiredStatusChange.Id);
            Assert.Single(missing);
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Error && m.NewJsonRef == "#/paths/~1api~1Parameters~1{a}/get/parameters/e"));
        }

        /// <summary>
        /// Verifieds that if you make an optional parameter required, it's caught.
        /// </summary>
        [Fact]
        public void ParameterStatusMore()
        {
            var messages = CompareSwagger("operation_check_01.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.RequiredStatusChange.Id);
            Assert.NotEmpty(missing);
            var error = missing.Skip(1).First();
            Assert.Equal(Category.Error, error.Severity);
            Assert.Equal("#/paths/~1api~1Parameters~1{a}/get/parameters/e", error.NewJsonRef);
        }

        /// <summary>
        /// If a parameter used to be constant (only had one valid value), but is changed to take more than one
        /// value, then it should be flagged.
        /// </summary>
        [Fact]
        public void ParameterConstantChanged()
        {
            var messages = CompareSwagger("operation_check_01.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.ConstantStatusHasChanged.Id);
            Assert.NotEmpty(missing);
            var error = missing.First();
            Assert.Equal(Category.Error, error.Severity);
            Assert.Equal("#/paths/~1api~1Parameters~1{a}/get/parameters/f", error.NewJsonRef);
        }

        /// <summary>
        /// Just changing the name of a parameter schema in the definitions section does not change the wire format for
        /// the parameter, so it shouldn't result in a separate error for the parameter.
        /// </summary>
        [Fact]
        public void ParameterSchemaNameChanged()
        {
            var messages = CompareSwagger("operation_check_02.json").ToArray();
            var redirected = messages.Where(m => m.Id == ComparisonMessages.ReferenceRedirection.Id);
            Assert.Empty(redirected);
        }

        /// <summary>
        /// Just changing the name of a parameter schema in the definitions section does not change the wire format for
        /// the parameter, so it shouldn't result in a separate error for the parameter.
        /// </summary>
        [Fact]
        public void ParameterSchemaContentsChanged()
        {
            var messages = CompareSwagger("operation_check_02.json").ToArray();
            var changed = messages.Where(m => m.Id == ComparisonMessages.TypeChanged.Id);
            Assert.NotEmpty(changed);
            var error = changed.First();
            Assert.Equal(Category.Error, error.Severity);
            Assert.Equal("#/paths/~1api~1Parameters/post/parameters/registry/properties/b", error.NewJsonRef);
        }

        /// <summary>
        /// Verify that removing a response code is flagged.
        /// </summary>
        [Fact]
        public void ResponseRemoved()
        {
            var messages = CompareSwagger("operation_check_01.json").ToArray();
            var removed = messages.Where(m => m.Id == ComparisonMessages.RemovedResponseCode.Id);
            Assert.NotEmpty(removed);
            var error = removed.First();
            Assert.Equal(Category.Error, error.Severity);
            Assert.Equal("#/paths/~1api~1Responses/get/200", error.NewJsonRef);
        }

        /// <summary>
        /// Verify that adding a response code is flagged.
        /// </summary>
        [Fact]
        public void ResponseAdded()
        {
            var messages = CompareSwagger("operation_check_01.json").ToArray();
            var removed = messages.Where(m => m.Id == ComparisonMessages.AddingResponseCode.Id);
            Assert.NotEmpty(removed);
            var error = removed.First();
            Assert.Equal(Category.Error, error.Severity);
            Assert.Equal("#/paths/~1api~1Responses/get/202", error.NewJsonRef);
        }

        /// <summary>
        /// Verify that changing the type of a response code is flagged.
        /// </summary>
        [Fact]
        public void ResponseTypeChanged()
        {
            var messages = CompareSwagger("operation_check_01.json").ToArray();
            var removed = messages.Where(m => m.Id == ComparisonMessages.TypeChanged.Id).ToArray();
            Assert.Equal(2, removed.Length);

            Assert.Equal(Category.Error, removed[0].Severity);
            Assert.Equal("#/paths/~1api~1Responses/get/201", removed[0].NewJsonRef);

            Assert.Equal(Category.Error, removed[1].Severity);
            Assert.Equal("#/paths/~1api~1Responses/get/400/properties/id", removed[1].NewJsonRef);
        }

        /// <summary>
        /// Verify that changing the $ref-referenced type of a response code is flagged.
        /// </summary>
        [Fact]
        public void ResponseSchemaChanged()
        {
            var messages = CompareSwagger("operation_check_02.json").ToArray();
            var removed = messages.Where(m => m.Id == ComparisonMessages.TypeChanged.Id && m.NewJsonRef.Contains("Responses")).ToArray();
            Assert.Single(removed);
            Assert.Equal(Category.Error, removed[0].Severity);
            Assert.Equal("#/paths/~1api~1Responses/get/400/properties/id", removed[0].NewJsonRef);
        }

        /// <summary>
        /// Verify that adding headers to a response definition is flagged.
        /// </summary>
        [Fact]
        public void ResponseHeaderAdded()
        {
            var messages = CompareSwagger("operation_check_03.json").ToArray();
            var added = messages.Where(m => m.Id == ComparisonMessages.AddingHeader.Id).ToArray();
            Assert.Single(added);
            Assert.Equal(Category.Info, added[0].Severity);
            Assert.Equal("#/paths/~1api~1Responses/get/200/x-c", added[0].NewJsonRef);
        }

        /// <summary>
        /// Verify that removing headers from a response definition is flagged.
        /// </summary>
        [Fact]
        public void ResponseHeaderRemoved()
        {
            var messages = CompareSwagger("operation_check_03.json").ToArray();
            var removed = messages.Where(m => m.Id == ComparisonMessages.RemovingHeader.Id).ToArray();
            Assert.Single(removed);
            Assert.Equal(Category.Error, removed[0].Severity);
            Assert.Equal("#/paths/~1api~1Responses/get/200/x-a", removed[0].NewJsonRef);
        }

        /// <summary>
        /// Verify that removing headers from a response definition is flagged.
        /// </summary>
        [Fact]
        public void ResponseHeaderTypeChanged()
        {
            var messages = CompareSwagger("operation_check_03.json").ToArray();
            var changed = messages.Where(m => m.Id == ComparisonMessages.TypeChanged.Id && m.NewJsonRef.Contains("Responses")).ToArray();
            Assert.Single(changed);
            Assert.Equal(Category.Error, changed[0].Severity);
            Assert.Equal("#/paths/~1api~1Responses/get/200/x-b", changed[0].NewJsonRef);
        }

        /// <summary>
        /// Verifies that changing the collection format for an array parameter is flagged.
        /// Direction: requests
        /// </summary>
        [Fact]
        public void RequestArrayFormatChanged()
        {
            var messages = CompareSwagger("operation_check_04.json").Where(m => m.NewJsonRef.Contains("Parameters")).ToArray();
            var changed = messages.Where(m => m.Id == ComparisonMessages.ArrayCollectionFormatChanged.Id).ToArray();

            Assert.Equal(4, changed.Length);
            Assert.Equal(Category.Error, changed[0].Severity);
            Assert.Equal(Category.Error, changed[1].Severity);
            Assert.Equal(Category.Error, changed[2].Severity);
            Assert.Equal(Category.Error, changed[3].Severity);
            Assert.Equal("#/paths/~1api~1Parameters/get/parameters/a", changed[0].NewJsonRef);
            Assert.Equal("#/paths/~1api~1Parameters/get/parameters/b", changed[1].NewJsonRef);
            Assert.Equal("#/paths/~1api~1Parameters/put/parameters/a/properties/a", changed[2].NewJsonRef);
            Assert.Equal("#/paths/~1api~1Parameters/put/parameters/a/properties/b", changed[3].NewJsonRef);
        }

        /// <summary>
        /// Verifies that making constraints stricter in requests are flagged as errors and that relaxed constraints
        /// are just informational.
        /// </summary>
        [Fact]
        public void RequestTypeConstraintsChanged()
        {
            var messages = CompareSwagger("operation_check_04.json").Where(m => m.NewJsonRef.Contains("Parameters")).ToArray();
            var stricter = messages.Where(m => m.Id == ComparisonMessages.ConstraintIsStronger.Id && m.Severity == Category.Error).ToArray();
            var breaking = messages.Where(m => m.Id == ComparisonMessages.ConstraintChanged.Id && m.Severity == Category.Error).ToArray();
            var info = messages.Where(m => m.Id > 0 && m.Severity == Category.Info).ToArray();

            Assert.Equal(11, stricter.Length);
            Assert.Equal(8, breaking.Length);
            Assert.Equal(13, info.Length);
        }

        /// <summary>
        /// Verifies that changing the collection format for an array parameter is flagged.
        /// Direction: responses
        /// </summary>
        [Fact]
        public void ResponseArrayFormatChanged()
        {
            var messages = CompareSwagger("operation_check_05.json").Where(m => m.NewJsonRef.Contains("Responses")).ToArray();
            var changed = messages.Where(m => m.Id == ComparisonMessages.ArrayCollectionFormatChanged.Id).ToArray();

            Assert.Equal(4, changed.Length);
            Assert.Equal(Category.Error, changed[0].Severity);
            Assert.Equal(Category.Error, changed[1].Severity);
            Assert.Equal(Category.Error, changed[2].Severity);
            Assert.Equal(Category.Error, changed[3].Severity);
            Assert.Equal("#/paths/~1api~1Responses/get/200/properties/a", changed[0].NewJsonRef);
            Assert.Equal("#/paths/~1api~1Responses/get/200/properties/b", changed[1].NewJsonRef);
        }

        /// <summary>
        /// Verifies that, in responses, relaxed constraints are errors while stricter constraints are informational.
        /// </summary>
        [Fact]
        public void ResponseTypeConstraintsChanged()
        {
            var messages = CompareSwagger("operation_check_05.json").Where(m => m.NewJsonRef.Contains("Responses")).ToArray();
            var relaxed = messages.Where(m => m.Id == ComparisonMessages.ConstraintIsWeaker.Id && m.Severity == Category.Error).ToArray();
            var breaking = messages.Where(m => m.Id == ComparisonMessages.ConstraintChanged.Id && m.Severity == Category.Error).ToArray();
            var info = messages.Where(m => m.Id > 0 && m.Severity == Category.Info).ToArray();

            Assert.Equal(13, relaxed.Length);
            Assert.Equal(8, breaking.Length);
            Assert.Equal(11, info.Length);
        }

        /// <summary>
        /// Verifies that changing the collection format for an array parameter is flagged.
        /// Direction: requests
        /// </summary>
        [Fact]
        public void GobalParamArrayFormatChanged()
        {
            var messages = CompareSwagger("param_check_01.json").ToArray();
            var changed = messages.Where(m => m.Id == ComparisonMessages.ArrayCollectionFormatChanged.Id).ToArray();

            Assert.Equal(6, changed.Length);
            Assert.Equal(Category.Error, changed[0].Severity);
            Assert.Equal(Category.Error, changed[1].Severity);
            Assert.Equal(Category.Error, changed[2].Severity);
            Assert.Equal(Category.Error, changed[3].Severity);
            Assert.Equal(Category.Error, changed[4].Severity);
            Assert.Equal(Category.Error, changed[5].Severity);
            Assert.Equal("#/parameters/a", changed[0].NewJsonRef);
            Assert.Equal("#/parameters/b", changed[1].NewJsonRef);
            Assert.Equal("#/parameters/e/properties/a", changed[2].NewJsonRef);
            Assert.Equal("#/parameters/e/properties/b", changed[3].NewJsonRef);
            Assert.Equal("#/definitions/A/properties/a", changed[4].NewJsonRef);
            Assert.Equal("#/definitions/A/properties/b", changed[5].NewJsonRef);
        }

        /// <summary>
        /// Verifies that making constraints stricter in requests are flagged as errors and that relaxed constraints
        /// are just informational.
        /// </summary>
        [Fact]
        public void GobalParamTypeConstraintsChanged()
        {
            var messages = CompareSwagger("param_check_01.json").Where(m => m.NewJsonRef.Contains("parameters")).ToArray();
            var stricter = messages.Where(m => m.Id == ComparisonMessages.ConstraintIsStronger.Id && m.Severity == Category.Error).ToArray();
            var breaking = messages.Where(m => m.Id == ComparisonMessages.ConstraintChanged.Id && m.Severity == Category.Error).ToArray();
            var info = messages.Where(m => m.Id > 0 && m.Severity == Category.Info).ToArray();

            Assert.Equal(11, stricter.Length);
            Assert.Equal(8, breaking.Length);
            Assert.Equal(15, info.Length);
        }

        /// <summary>
        /// Verifies that changing the collection format for an array parameter is flagged.
        /// Direction: responses
        /// </summary>
        [Fact]
        public void GobalResponseArrayFormatChanged()
        {
            var messages = CompareSwagger("response_check_01.json").ToArray();
            var changed = messages.Where(m => m.Id == ComparisonMessages.ArrayCollectionFormatChanged.Id).ToArray();

            Assert.Equal(6, changed.Length);
            Assert.Equal(Category.Error, changed[0].Severity);
            Assert.Equal(Category.Error, changed[1].Severity);
            Assert.Equal(Category.Error, changed[2].Severity);
            Assert.Equal(Category.Error, changed[3].Severity);
            Assert.Equal(Category.Error, changed[4].Severity);
            Assert.Equal(Category.Error, changed[5].Severity);
            Assert.Equal("#/responses/200/properties/a", changed[0].NewJsonRef);
            Assert.Equal("#/responses/200/properties/b", changed[1].NewJsonRef);
            Assert.Equal("#/responses/201/properties/a", changed[2].NewJsonRef);
            Assert.Equal("#/responses/201/properties/b", changed[3].NewJsonRef);
            Assert.Equal("#/definitions/A/properties/a", changed[4].NewJsonRef);
            Assert.Equal("#/definitions/A/properties/b", changed[5].NewJsonRef);
        }

        /// <summary>
        /// Verifies that, in global responses, relaxed constraints are errors while stricter constraints are informational.
        /// </summary>
        [Fact]
        public void GlobalResponseTypeConstraintsChanged()
        {
            var messages = CompareSwagger("response_check_01.json").Where(m => m.NewJsonRef.Contains("responses")).ToArray();
            var relaxed = messages.Where(m => m.Id == ComparisonMessages.ConstraintIsWeaker.Id && m.Severity == Category.Error).ToArray();
            var breaking = messages.Where(m => m.Id == ComparisonMessages.ConstraintChanged.Id && m.Severity == Category.Error).ToArray();
            var info = messages.Where(m => m.Id > 0 && m.Severity == Category.Info).ToArray();

            Assert.Equal(13, relaxed.Length);
            Assert.Equal(8, breaking.Length);
            Assert.Equal(13, info.Length);
        }

        [Fact]
        public void RemovedPropertyTest()
        {
            var messages = CompareSwagger("removed_property.json").ToArray();
            Assert.True(messages.Where(m => m.Id == ComparisonMessages.RemovedProperty.Id).Any());
        }
    }
}
