namespace AutoRest.Swagger
{
    public static class ComparisonMessages
    {
        public static MessageTemplate RemovedProperty = new MessageTemplate
        {
            Id = 1033,
            Code = nameof(ComparisonMessages.RemovedProperty),
            Message = "The new version is missing a property found in the old version. Was '{0}' renamed or removed?",
            Type = MessageType.Removal
        };

        public static MessageTemplate AddedRequiredProperty = new MessageTemplate
        {
            Id = 1034,
            Code = nameof(ComparisonMessages.AddedRequiredProperty),
            Message = "The new version has new required property '{0}' that was not found in the old version.",
            Type = MessageType.Addition
        };

        public static MessageTemplate AddedReadOnlyPropertyInResponse = new MessageTemplate
        {
            Id = 1040,
            Code = nameof(ComparisonMessages.AddedReadOnlyPropertyInResponse),
            Message = "The new version has a new read-only property '{0}' in response that was not found in the old version.",
            Type = MessageType.Addition
        };

        public static MessageTemplate AddedPropertyInResponse = new MessageTemplate
        {
            Id = 1041,
            Code = nameof(ComparisonMessages.AddedPropertyInResponse),
            Message = "The new version has a new property '{0}' in response that was not found in the old version.",
            Type = MessageType.Addition
        };

        public static MessageTemplate AddedOptionalProperty = new MessageTemplate
        {
            Id = 1045,
            Code = nameof(ComparisonMessages.AddedOptionalProperty),
            Message = "The new version has a new optional property '{0}' that was not found in the old version.",
            Type = MessageType.Addition
        };

        public static MessageTemplate RemovedDefinition = new MessageTemplate
        {
            Id = 1006,
            Code = nameof(ComparisonMessages.RemovedDefinition),
            Message = "The new version is missing a definition that was found in the old version. Was '{0}' removed or renamed?",
            Type = MessageType.Removal
        };

        public static MessageTemplate RemovedPath = new MessageTemplate
        {
            Id = 1005,
            Code = nameof(ComparisonMessages.RemovedPath),
            Message = "The new version is missing a path that was found in the old version. Was path '{0}' removed or restructured?",
            Type = MessageType.Removal
        };

        public static MessageTemplate AddedPath = new MessageTemplate
        {
            Id = 1038,
            Code = nameof(ComparisonMessages.AddedPath),
            Message = "The new version is adding a path that was not found in the old version.",
            Type = MessageType.Addition
        };

        public static MessageTemplate RemovedOperation = new MessageTemplate
        {
            Id = 1035,
            Code = nameof(ComparisonMessages.RemovedOperation),
            Message = "The new version is missing an operation that was found in the old version. Was operationId '{0}' removed or restructured?",
            Type = MessageType.Removal
        };

        public static MessageTemplate ModifiedOperationId = new MessageTemplate
        {
            Id = 1008,
            Code = nameof(ComparisonMessages.ModifiedOperationId),
            Message = "The operation id has been changed from '{0}' to '{1}'. This will impact generated code.",
            Type = MessageType.Update
        };

        public static MessageTemplate AddedOperation = new MessageTemplate
        {
            Id = 1039,
            Code = nameof(ComparisonMessages.AddedOperation),
            Message = "The new version is adding an operation that was not found in the old version.",
            Type = MessageType.Addition
        };

        public static MessageTemplate RemovedRequiredParameter = new MessageTemplate
        {
            Id = 1009,
            Code = nameof(ComparisonMessages.RemovedRequiredParameter),
            Message = "The required parameter '{0}' was removed in the new version.",
            Type = MessageType.Removal
        };

        public static MessageTemplate RemovedOptionalParameter = new MessageTemplate
        {
            Id = 1046,
            Code = nameof(ComparisonMessages.RemovedOptionalParameter),
            Message = "The optional parameter '{0}' was removed in the new version.",
            Type = MessageType.Removal
        };

        public static MessageTemplate ChangedParameterOrder = new MessageTemplate
        {
            Id = 1042,
            Code = nameof(ComparisonMessages.ChangedParameterOrder),
            Message = "The order of parameter '{0}' was changed. ",
            Type = MessageType.Update
        };

        public static MessageTemplate AddingRequiredParameter = new MessageTemplate
        {
            Id = 1010,
            Code = nameof(ComparisonMessages.AddingRequiredParameter),
            Message = "The required parameter '{0}' was added in the new version.",
            Type = MessageType.Addition
        };

        public static MessageTemplate AddingOptionalParameter = new MessageTemplate
        {
            Id = 1043,
            Code = nameof(ComparisonMessages.AddingOptionalParameter),
            Message = "The optional parameter '{0}' was added in the new version.",
            Type = MessageType.Addition
        };

        public static MessageTemplate RequiredStatusChange = new MessageTemplate
        {
            Id = 1025,
            Code = nameof(ComparisonMessages.RequiredStatusChange),
            Message = "The 'required' status changed from the old version('{0}') to the new version('{1}').",
            Type = MessageType.Update
        };

        public static MessageTemplate TypeChanged = new MessageTemplate
        {
            Id = 1026,
            Code = nameof(ComparisonMessages.TypeChanged),
            Message = "The new version has a different type '{0}' than the previous one '{1}'.",
            Type = MessageType.Update
        };

        public static MessageTemplate RemovedEnumValue = new MessageTemplate
        {
            Id = 1019,
            Code = nameof(ComparisonMessages.RemovedEnumValue),
            Message = "The new version is removing enum value(s) '{0}' from the old version.",
            Type = MessageType.Removal
        };

        public static MessageTemplate AddedEnumValue = new MessageTemplate
        {
            Id = 1020,
            Code = nameof(ComparisonMessages.AddedEnumValue),
            Message = "The new version is adding enum value(s) '{0}' from the old version.",
            Type = MessageType.Addition
        };

        public static MessageTemplate ConstraintIsStronger = new MessageTemplate
        {
            Id = 1024,
            Code = nameof(ComparisonMessages.ConstraintIsStronger),
            Message = "The new version has a more constraining '{0}' value than the previous one.",
            Type = MessageType.Update
        };

        public static MessageTemplate ConstraintIsWeaker = new MessageTemplate
        {
            Id = 1037,
            Code = nameof(ComparisonMessages.ConstraintIsWeaker),
            Message = "The new version has a less constraining '{0}' value than the previous one.",
            Type = MessageType.Update
        };

        public static MessageTemplate ReadonlyPropertyChanged = new MessageTemplate
        {
            Id = 1029,
            Code = nameof(ComparisonMessages.ReadonlyPropertyChanged),
            Message = "The read only property has changed from '{0}' to '{1}'.",
            Type = MessageType.Update
        };

        public static MessageTemplate VersionsReversed = new MessageTemplate
        {
            Id = 1000,
            Code = nameof(ComparisonMessages.VersionsReversed),
            Message = "The new version has a lower value than the old: {0} -> {1}",
            Type = MessageType.Update
        };

        public static MessageTemplate NoVersionChange = new MessageTemplate
        {
            Id = 1001,
            Code = nameof(ComparisonMessages.NoVersionChange),
            Message = "The versions have not changed.",
            Type = MessageType.Update
        };

        public static MessageTemplate ProtocolNoLongerSupported = new MessageTemplate
        {
            Id = 1002,
            Code = nameof(ComparisonMessages.ProtocolNoLongerSupported),
            Message = "The new version does not support '{0}' as a protocol.",
            Type = MessageType.Removal
        };

        public static MessageTemplate RequestBodyFormatNoLongerSupported = new MessageTemplate
        {
            Id = 1003,
            Code = nameof(ComparisonMessages.RequestBodyFormatNoLongerSupported),
            Message = "The new version does not support '{0}' as a request body format.",
            Type = MessageType.Removal
        };

        public static MessageTemplate ResponseBodyFormatNowSupported = new MessageTemplate
        {
            Id = 1004,
            Code = nameof(ComparisonMessages.ResponseBodyFormatNowSupported),
            Message = "The old version did not support '{0}' as a response body format.",
            Type = MessageType.Addition
        };

        public static MessageTemplate RemovedClientParameter = new MessageTemplate
        {
            Id = 1007,
            Code = nameof(ComparisonMessages.RemovedClientParameter),
            Message = "The new version is missing a client parameter that was found in the old version. Was '{0}' removed or renamed?",
            Type = MessageType.Removal
        };

        public static MessageTemplate AddingResponseCode = new MessageTemplate
        {
            Id = 1011,
            Code = nameof(ComparisonMessages.AddingResponseCode),
            Message = "The new version adds a response code '{0}'.",
            Type = MessageType.Addition
        };

        public static MessageTemplate RemovedResponseCode = new MessageTemplate
        {
            Id = 1012,
            Code = nameof(ComparisonMessages.RemovedResponseCode),
            Message = "The new version removes the response code '{0}'",
            Type = MessageType.Removal
        };

        public static MessageTemplate AddingHeader = new MessageTemplate
        {
            Id = 1013,
            Code = nameof(ComparisonMessages.AddingHeader),
            Message = "The new version adds a required header '{0}'.",
            Type = MessageType.Addition
        };

        public static MessageTemplate RemovingHeader = new MessageTemplate
        {
            Id = 1014,
            Code = nameof(ComparisonMessages.RemovingHeader),
            Message = "The new version removs a required header '{0}'.",
            Type = MessageType.Removal
        };

        public static MessageTemplate ParameterInHasChanged = new MessageTemplate
        {
            Id = 1015,
            Code = nameof(ComparisonMessages.ParameterInHasChanged),
            Message = "How the parameter is passed has changed -- it used to be '{0}', now it is '{1}'.",
            Type = MessageType.Update
        };

        public static MessageTemplate ConstantStatusHasChanged = new MessageTemplate
        {
            Id = 1016,
            Code = nameof(ComparisonMessages.ConstantStatusHasChanged),
            Message = "The 'constant' status changed from the old version to the new.",
            Type = MessageType.Update
        };

        public static MessageTemplate ReferenceRedirection = new MessageTemplate
        {
            Id = 1017,
            Code = nameof(ComparisonMessages.ReferenceRedirection),
            Message = "The '$ref' property points to different models in the old and new versions.",
            Type = MessageType.Update
        };

        public static MessageTemplate AddedAdditionalProperties = new MessageTemplate
        {
            Id = 1021,
            Code = nameof(ComparisonMessages.AddedAdditionalProperties),
            Message = "The new version adds an 'additionalProperties' element.",
            Type = MessageType.Addition
        };

        public static MessageTemplate RemovedAdditionalProperties = new MessageTemplate
        {
            Id = 1022,
            Code = nameof(ComparisonMessages.RemovedAdditionalProperties),
            Message = "The new version removes the 'additionalProperties' element.",
            Type = MessageType.Removal
        };

        public static MessageTemplate TypeFormatChanged = new MessageTemplate
        {
            Id = 1023,
            Code = nameof(ComparisonMessages.TypeFormatChanged),
            Message = "The new version has a different format '{0}' than the previous one '{1}'.",
            Type = MessageType.Update
        };

        public static MessageTemplate DefaultValueChanged = new MessageTemplate
        {
            Id = 1027,
            Code = nameof(ComparisonMessages.DefaultValueChanged),
            Message = "The new version has a different default value than the previous one.",
            Type = MessageType.Update
        };

        public static MessageTemplate ArrayCollectionFormatChanged = new MessageTemplate
        {
            Id = 1028,
            Code = nameof(ComparisonMessages.ArrayCollectionFormatChanged),
            Message = "The new version has a different array collection format than the previous one.",
            Type = MessageType.Update
        };

        public static MessageTemplate DifferentDiscriminator = new MessageTemplate
        {
            Id = 1030,
            Code = nameof(ComparisonMessages.DifferentDiscriminator),
            Message = "The new version has a different discriminator than the previous one.",
            Type = MessageType.Update
        };

        public static MessageTemplate DifferentExtends = new MessageTemplate
        {
            Id = 1031,
            Code = nameof(ComparisonMessages.DifferentExtends),
            Message = "The new version has a different 'extends' property than the previous one.",
            Type = MessageType.Update
        };

        public static MessageTemplate DifferentAllOf = new MessageTemplate
        {
            Id = 1032,
            Code = nameof(ComparisonMessages.DifferentAllOf),
            Message = "The new version has a different 'allOf' property than the previous one.",
            Type = MessageType.Update
        };

        public static MessageTemplate ConstraintChanged = new MessageTemplate
        {
            Id = 1036,
            Code = nameof(ComparisonMessages.ConstraintChanged),
            Message = "The new version has a different '{0}' value than the previous one.",
            Type = MessageType.Update
        };

        public static MessageTemplate XmsLongRunningOperationChanged = new MessageTemplate
        {
            Id = 1044,
            Code = nameof(ComparisonMessages.XmsLongRunningOperationChanged),
            Message = "The new version has a different 'x-ms-longrunning-operation' value than the previous one.",
            Type = MessageType.Update
        };

        public static MessageTemplate XmsEnumChanged = new MessageTemplate
        {
            Id = 1047,
            Code = nameof(ComparisonMessages.XmsEnumChanged),
            Message = "The new version has a different x-ms-enum '{0}' than the previous one.",
            Type = MessageType.Update
        };

        public static MessageTemplate AddedXmsEnum = new MessageTemplate
        {
            Id = 1048,
            Code = nameof(ComparisonMessages.AddedXmsEnum),
            Message = "The new version adds a x-ms-enum extension.",
            Type = MessageType.Addition
        };
        public static MessageTemplate RemovedXmsEnum = new MessageTemplate
        {
            Id = 1049,
            Code = nameof(ComparisonMessages.RemovedXmsEnum),
            Message = "The new version is missing a 'x-ms-enum' found in the old version.",
            Type = MessageType.Removal
        };
    }
}