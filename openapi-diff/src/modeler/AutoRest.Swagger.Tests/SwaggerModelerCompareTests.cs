// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.IO;
using System.Linq;
using Xunit;
using System.Collections.Generic;
using OpenApiDiff.Core.Logging;
using System.Reflection;
using Newtonsoft.Json.Linq;

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
        private static IEnumerable<ComparisonMessage> CompareSwagger(string input)
        {
            var modeler = new SwaggerModeler();
            var baseDir = Directory.GetParent(typeof(SwaggerModelerCompareTests).GetTypeInfo().Assembly.Location.ToString()).ToString();
            var oldFileName = Path.Combine(baseDir, "Resource", "Swagger", "old", input);
            var newFileName = Path.Combine(baseDir, "Resource", "Swagger", "new", input);
            var result = modeler.Compare(
                Path.Combine("old", input),
                File.ReadAllText(oldFileName),
                Path.Combine("new", input),
                File.ReadAllText(newFileName)
            );
            ValidateMessages(result);
            return result;
        }

        private static void ValidateMessage(ComparisonMessage message)
        {
            var newLocation = message.NewLocation();
            var oldLocation = message.OldLocation();
            Assert.True(oldLocation != null || newLocation != null);
            switch (message.Mode)
            {
                case MessageType.Update:
                    break;
                case MessageType.Addition:
                    Assert.NotNull(newLocation);
                    break;
                case MessageType.Removal:
                    Assert.NotNull(oldLocation);
                    break;
            }
        }

        private static void ValidateMessages(IEnumerable<ComparisonMessage> messages)
        {
            foreach (var message in messages)
            {
                ValidateMessage(message);
            }
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
            var missing0 = missing.First();
            Assert.Equal(Category.Error, missing0.Severity);
            Assert.NotNull(missing0.NewJson());
            Assert.NotNull(missing0.OldJson());
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
            var error = missing.Where(err => err.NewJsonRef.StartsWith("new/type_changed.json#/definitions/")).FirstOrDefault();
            Assert.NotNull(error);
            Assert.Equal(Category.Error, error.Severity);
            Assert.Equal("new/type_changed.json#/definitions/Database/properties/a", error.NewJsonRef);
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
            var error = missing.Where(err => err.NewJsonRef.StartsWith("new/misc_checks_01.json#/definitions/")).FirstOrDefault();
            Assert.NotNull(error);
            Assert.Equal(Category.Error, error.Severity);
            Assert.Equal("new/misc_checks_01.json#/definitions/Database/properties/c", error.NewJsonRef);
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
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Error && m.OldJsonRef == "old/removed_path.json#/paths/~1api~1Parameters~1{a}"));
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Error && m.OldJsonRef == "old/removed_path.json#/paths/~1api~1Responses"));
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
            Assert.NotEmpty(missing.Where(m => m.Severity == Category.Error && m.NewJsonRef == "new/removed_operation.json#/paths/~1api~1Operations"));
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
            var x = missing.First(m => m.Severity == Category.Error && m.NewJsonRef == "new/changed_operation_id.json#/paths/~1api~1Paths/get");
            Assert.NotNull(x.NewJson());
            Assert.NotNull(x.OldJson());
            var y = missing.First(m => m.Severity == Category.Error && m.NewJsonRef == "new/changed_operation_id.json#/paths/~1api~1Operations/post");
            Assert.NotNull(y.NewJson());
            Assert.NotNull(y.OldJson());
        }

        /// <summary>
        /// Verifies that if the operations id is missing for a path in both old and new contracts,
        /// the execution doesn't fail and no version change is required.
        /// </summary>
        [Fact]
        public void OperationIdIsNull()
        {
            var messages = CompareSwagger("missing_operation_id.json").ToArray();
            Assert.Single(messages);
            Assert.Equal(ComparisonMessages.NoVersionChange.Id, messages[0].Id);
        }

        /// <summary>
        /// Verifies that if you remove an operationId from an operation in a path, it's caught.
        /// </summary>
        [Fact]
        public void OperationIdRemoved()
        {
            var messages = CompareSwagger("removed_operation_id.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.ModifiedOperationId.Id);
            Assert.Equal(1, missing.Count());
            var x = missing.First(m => m.Severity == Category.Error && m.NewJsonRef == "new/removed_operation_id.json#/paths/~1api~1Operations/get");
            Assert.NotNull(x.NewJson());
            Assert.NotNull(x.OldJson());
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
            var x = missing.First(
                m => m.Severity == Category.Info &&
                m.NewJsonRef == "new/added_path.json#/paths/~1api~1Paths"
            );
            Assert.NotNull(x.NewJson());
            Assert.NotNull(x.NewLocation());
            Assert.Null(x.OldJson());

            missing = messages.Where(m => m.Id == ComparisonMessages.AddedOperation.Id);
            Assert.Single(missing);
            x = missing.First(m => m.Severity == Category.Info && m.NewJsonRef == "new/added_path.json#/paths/~1api~1Operations/post");
            Assert.NotNull(x.NewJson());
            Assert.Null(x.OldJson());

            var output = x.GetValidationMessagesAsJson();
            var raw = JToken.Parse(output);
            Assert.Equal(JTokenType.Object, raw.Type);
            Assert.Equal("new/added_path.json:38:15", raw["new"]["location"].Value<string>());
            Assert.Equal("paths./api/Operations.post", raw["new"]["path"].Value<string>());
            Assert.Null(raw["old"]["location"]);
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
            var x = missing.First(m => m.Severity == Category.Error && m.OldJsonRef == "old/required_parameter.json#/paths/~1api~1Parameters~1{a}/get/parameters/4");
            Assert.Null(x.NewJson());
            Assert.NotNull(x.OldJson());
        }

        /// <summary>
        /// Verifies that if you remove a required parameter, it's found.
        /// </summary>
        [Fact]
        public void OptionalParameterRemoved()
        {
            var messages = CompareSwagger("optional_parameter.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.RemovedOptionalParameter.Id);
            Assert.Single(missing);
            var x = missing.First(m => m.Severity == Category.Error && m.OldJsonRef == "old/optional_parameter.json#/paths/~1api~1Parameters~1{a}/get/parameters/4");
            Assert.Null(x.NewJson());
            Assert.NotNull(x.OldJson());
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
            Assert.Equal("new/added_required_property.json#/paths/~1api~1Parameters/put/parameters/0/schema", error.NewJsonRef);
            Assert.NotNull(error.NewJson());
            Assert.NotNull(error.OldJson());
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
            Assert.Null(error.NewJsonRef);
            Assert.Equal("old/operation_check_03.json#/paths/~1api~1Parameters/get/parameters/1", error.OldJsonRef);
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
            var x = missing.First(m => m.Severity == Category.Error && m.NewJsonRef == "new/required_parameter.json#/paths/~1api~1Parameters~1{a}/get/parameters/4");
            Assert.NotNull(x.NewJson());
            Assert.Null(x.OldJson());
        }

        public void OptionalParameterAdded()
        {
            var messages = CompareSwagger("optional_parameter.json").ToArray();
            var missing = messages.Where(m => m.Id == ComparisonMessages.AddingOptionalParameter.Id);
            Assert.Single(missing);
            var x = missing.First(m => m.Severity == Category.Error && m.NewJsonRef == "new/optional_parameter.json#/paths/~1api~1Parameters~1{a}/get/parameters/4");
            Assert.NotNull(x.NewJson());
            Assert.Null(x.OldJson());
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
            Assert.NotEmpty(missing.Where(
                m => m.Severity == Category.Info &&
                m.NewJsonRef == "new/readonly_changes.json#/paths/~1subscriptions~1{subscriptionId}~1providers~1Microsoft.Storage~1checkNameAvailability/post/responses/200/schema/properties"));
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
            var x = missing.First(
                m => m.Severity == Category.Error &&
                m.NewJsonRef.Contains(
                    "#/paths/~1subscriptions~1{subscriptionId}~1providers~1Microsoft.Storage~1checkNameAvailability/post/responses/200/schema/properties"
                )
            );
            Assert.NotNull(x.NewJson());
            // Assert.Null(x.OldJson());
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
            Assert.Equal(3, missing.Count());
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
            Assert.Equal("new/operation_check_03.json#/paths/~1api~1Parameters/get/parameters/3", error.NewJsonRef);
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
            Assert.NotNull(error.NewJsonRef);
            Assert.Equal("old/operation_check_01.json#/paths/~1api~1Parameters~1{a}/get/parameters/1", error.OldJsonRef);
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
            var x = missing.First(m => m.Severity == Category.Error && m.NewJsonRef == "new/required_parameter.json#/paths/~1api~1Parameters~1{a}/get/parameters/3");
            Assert.NotNull(x.NewJson());
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
            Assert.NotNull(error.NewJsonRef);
            Assert.Equal("old/operation_check_01.json#/paths/~1api~1Parameters~1{a}/get/parameters/3", error.OldJsonRef);
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
            Assert.NotNull(error.NewJsonRef);
            Assert.Equal("old/operation_check_01.json#/paths/~1api~1Parameters~1{a}/get/parameters/4", error.OldJsonRef);
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
            Assert.Equal("new/operation_check_02.json#/paths/~1api~1Parameters/post/parameters/0/schema/properties/b", error.NewJsonRef);
            Assert.Equal("old/operation_check_02.json#/paths/~1api~1Parameters/post/parameters/0/schema/properties/b", error.OldJsonRef);
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
            Assert.Equal("new/operation_check_01.json#/paths/~1api~1Responses/get/responses/200", error.NewJsonRef);
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
            Assert.Equal("new/operation_check_01.json#/paths/~1api~1Responses/get/responses/202", error.NewJsonRef);
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
            Assert.Equal("new/operation_check_01.json#/paths/~1api~1Responses/get/responses/201/schema", removed[0].NewJsonRef);

            Assert.Equal(Category.Error, removed[1].Severity);
            Assert.Equal("new/operation_check_01.json#/paths/~1api~1Responses/get/responses/400/schema/properties/id", removed[1].NewJsonRef);
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
            Assert.Equal("new/operation_check_02.json#/paths/~1api~1Responses/get/responses/400/schema/properties/id", removed[0].NewJsonRef);
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
            Assert.Equal("new/operation_check_03.json#/paths/~1api~1Responses/get/responses/200/headers/x-c", added[0].NewJsonRef);
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
            Assert.Equal("new/operation_check_03.json#/paths/~1api~1Responses/get/responses/200/headers/x-a", removed[0].NewJsonRef);
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
            Assert.Equal("new/operation_check_03.json#/paths/~1api~1Responses/get/responses/200/headers/x-b", changed[0].NewJsonRef);
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
            Assert.Equal("new/operation_check_04.json#/paths/~1api~1Parameters/get/parameters/0", changed[0].NewJsonRef);
            Assert.Equal("new/operation_check_04.json#/paths/~1api~1Parameters/get/parameters/1", changed[1].NewJsonRef);
            Assert.Equal("new/operation_check_04.json#/paths/~1api~1Parameters/put/parameters/0/schema/properties/a", changed[2].NewJsonRef);
            Assert.Equal("new/operation_check_04.json#/paths/~1api~1Parameters/put/parameters/0/schema/properties/b", changed[3].NewJsonRef);
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
        /// Verifies that making constraints stricter in requests are flagged, weaker are flagged and adding enum to parameters are flagged
        /// </summary>
        [Fact]
        public void RequestTypeContraintsWithNewEnum()
        {
            var messages = CompareSwagger("enum_values_changed.json").Where(m => m.NewJsonRef.Contains("Parameters")).ToArray();
     
            var removedValue = messages.Where(m => m.Id == ComparisonMessages.RemovedEnumValue.Id).ToArray();
            Assert.Single(removedValue);
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
            Assert.Equal("new/operation_check_05.json#/paths/~1api~1Responses/get/responses/200/schema/properties/a", changed[0].NewJsonRef);
            Assert.Equal("new/operation_check_05.json#/paths/~1api~1Responses/get/responses/200/schema/properties/b", changed[1].NewJsonRef);
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
            Assert.Equal("new/param_check_01.json#/parameters/a", changed[0].NewJsonRef);
            Assert.Equal("new/param_check_01.json#/parameters/b", changed[1].NewJsonRef);
            Assert.Equal("new/param_check_01.json#/parameters/e/schema/properties/a", changed[2].NewJsonRef);
            Assert.Equal("new/param_check_01.json#/parameters/e/schema/properties/b", changed[3].NewJsonRef);
            Assert.Equal("new/param_check_01.json#/definitions/A/properties/a", changed[4].NewJsonRef);
            Assert.Equal("new/param_check_01.json#/definitions/A/properties/b", changed[5].NewJsonRef);
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
            Assert.Equal(13, info.Length);
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
            Assert.Equal("new/response_check_01.json#/responses/200/schema/properties/a", changed[0].NewJsonRef);
            Assert.Equal("new/response_check_01.json#/responses/200/schema/properties/b", changed[1].NewJsonRef);
            Assert.Equal("new/response_check_01.json#/responses/201/schema/properties/a", changed[2].NewJsonRef);
            Assert.Equal("new/response_check_01.json#/responses/201/schema/properties/b", changed[3].NewJsonRef);
            Assert.Equal("new/response_check_01.json#/definitions/A/properties/a", changed[4].NewJsonRef);
            Assert.Equal("new/response_check_01.json#/definitions/A/properties/b", changed[5].NewJsonRef);
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
            Assert.Equal(11, info.Length);
        }

        [Fact]
        public void RemovedPropertyTest()
        {
            var messages = CompareSwagger("removed_property.json").ToArray();
            Assert.True(messages.Where(m => m.Id == ComparisonMessages.RemovedProperty.Id).Any());
        }

        [Fact]
        public void FormatChanged()
        {
            var messages = CompareSwagger("format_check_01.json").ToArray();
            Assert.True(messages.Where(m => m.Id == ComparisonMessages.TypeFormatChanged.Id).Any());
        }

        [Fact]
        public void FormatRemoved()
        {
            var messages = CompareSwagger("format_check_02.json").ToArray();
            Assert.True(messages.Where(m => m.Id == ComparisonMessages.TypeFormatChanged.Id).Any());
        }

        [Fact]
        public void CommonParameterAdded()
        {
            var messages = CompareSwagger("common_parameter_check_01.json").ToArray();
            Assert.Single(messages.Where(m => m.Severity == Category.Error));
        }

        [Fact]
        public void CommonParameterChanged()
        {
            var messages = CompareSwagger("common_parameter_check_02.json").ToArray();
            Assert.Single(messages.Where(m => m.Id == ComparisonMessages.RemovedRequiredParameter.Id));
            Assert.Single(messages.Where(m => m.Id == ComparisonMessages.ParameterInHasChanged.Id));
            Assert.Equal(2, messages.Where(m => m.Id == ComparisonMessages.RequiredStatusChange.Id).Count());
            Assert.Single(messages.Where(m => m.Id == ComparisonMessages.RemovedRequiredParameter.Id && m.Severity == Category.Error));
        }

        [Fact]
        public void CommonParameterOverride()
        {
            // For the parameters both defined in path/operation, the operation parameters should override path parameters.
            var messages = CompareSwagger("common_parameter_check_03.json").ToArray();
            Assert.Empty(messages.Where(m => m.Severity == Category.Error));
        }

        [Fact]
        public void CommonParameterWithRef()
        {
            var messages = CompareSwagger("common_parameter_check_04.json").ToArray();
            Assert.Equal(2, messages.Where(m => m.Id == ComparisonMessages.RequiredStatusChange.Id).Count());
            var changes = messages.Where(m => m.Id == ComparisonMessages.RequiredStatusChange.Id && m.Severity == Category.Error).ToList();
            Assert.Equal(2, changes.Count());
        }

        [Fact]
        public void XmsEnumModelAsString()
        {
            var messages = CompareSwagger("enum_as_string.json").ToArray();
            Assert.Empty(messages.Where(m => m.Id == ComparisonMessages.AddedEnumValue.Id));
        }

        [Fact]
        public void ChangedParameterOrder()
        {
            var messages = CompareSwagger("parameter_order_change.json").ToArray();
            Assert.Equal(2, messages.Where(m => m.Id == ComparisonMessages.ChangedParameterOrder.Id).Count());
        }

        [Fact]
        public void ChangedXmsLongRunningOperation()
        {
            var messages = CompareSwagger("long_running_operation.json").ToArray();
            Assert.Equal(1, messages.Where(m => m.Id == ComparisonMessages.XmsLongRunningOperationChanged.Id).Count());
        }

        [Fact]
        public void AddedOptionalProperty()
        {
            var messages = CompareSwagger("added_optional_property.json").ToArray();
            Assert.Equal(1, messages.Where(m => m.Id == ComparisonMessages.AddedOptionalProperty.Id).Count());
        }
    }
}
