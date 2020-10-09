## Rules
| Id Rule Name | IsSameVersionBreakingChange | IsCrossVersionBreakingChange | comments |
| --- | --- | --- | --- |
| [1002 - ProtocolNoLongerSupported](rules/1002.md) |  Y |  ? |  |
| [1003 - RequestBodyFormatNoLongerSupported](rules/1003.md) | Y | ? | |
| [1004 - ResponseBodyFormatNowSupported](rules/1004.md) | Y | ? | |
| [1011 - AddingResponseCode](rules/1011.md) | Y | ? | behavior |
| [1012 - RemovedResponseCode](rules/1012.md)| Y | Y | |
| [1013 - AddingHeader](rules/1013.md) | Y | ? | |
| [1014 - RemovingHeader](rules/1014.md)  | Y | ? | |
| [1005 - RemovedPath](rules/1005.md)  | Y | N | |
| [1006 - RemovedDefinition](rules/1006.md) | Y | ? | |
| [1007 - RemovedClientParameter](rules/1007.md) | Y | ? | |
| [1008 - ModifiedOperationId](rules/1008.md)  | Y | ? | |
| [1009 - RemovedRequiredParameter](rules/1009.md) | Y | Y |  |
| [1010 - AddingRequiredParameter](rules/1010.md) | Y | Y | |
| [1015 - ParameterInHasChanged](rules/1015.md) | Y | ? | |
| [1016 - ConstantStatusHasChanged](rules/1016.md) | Y | ? | |
| [1019 - RemovedEnumValue](rules/1019.md) | Y | Y | |
| [1020 - AddedEnumValue](rules/1020.md)  | Y | Y | Allowed in new api version , and needs to consider extensible enum is allowed in same version.
| [1021 - AddedAdditionalProperties](rules/1021.md) | Y | ? | |
| [1022 - RemovedAdditionalProperties](rules/1022.md) | Y | ? | |
| [1023 - TypeFormatChanged](rules/1023.md)   | Y | ? | allowed int64 -> int32 in response , and int32 -> int64 in request |
| [1026 - TypeChanged](rules/1026.md) | Y | Y |  |
| [1025 - RequiredStatusChange](rules/1025.md)  | Y | Y | allowed required to optional in request in cross api version |
| [1027 - DefaultValueChanged](rules/1027.md) | Y | ? | | 
| [1028 - ArrayCollectionFormatChanged](rules/1028.md)  | Y | ? | |
| [1029 - ReadonlyPropertyChanged](rules/1029.md)  | Y | ? | |
| [1030 - DifferentDiscriminator](rules/1030.md)  | Y | ? | |
| [1031 - DifferentExtends](rules/1031.md)  | Y | ? | |
| [1032 - DifferentAllOf](rules/1032.md)  | Y | ? | |
| [1017 - ReferenceRedirection](rules/1017.md)  | Y | ? | |
| [1033 - RemovedProperty](rules/1033.md)  | Y | ? | |
| [1034 - AddedRequiredProperty](rules/1034.md)   | Y | ? | |
| [1035 - RemovedOperation](rules/1035.md)  | Y | ? | |
| [1036 - ConstraintChanged](rules/1036.md)  | Y | ? | |
| [1037 - ConstraintIsWeaker](rules/1037.md)  | Y | ? | |
| [1023 - ConstraintIsStronger](rules/1024.md)  | Y | ? | |
| [1038 - AddedPath](rules/1038.md)   | Y | ? | needs to meet the new policy |
| [1039 - AddedOperation](rules/1039.md)  | Y | ? |  needs to meet the new policy |
| [1040 - AddedReadOnlyPropertyInResponse](rules/1040.md)  | Y | ? | |
| [1041 - AddedPropertyInResponse](rules/1041.md)  | Y | ? | allowed in cross api versions |
