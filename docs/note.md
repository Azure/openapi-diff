## Overview
The openapi-diff tool compares two swagger files based on the certain rules and output the result. The rule have three severity levels: error,warning,info. During swagger reviewing, the breaking change checker treat the rule violation whose severity level is 'error' in the result as a breaking change.

## Existing Rules
The table shows the details of all the rules . The field : 'Allowable level' (which means the error can be allowed in the same version or in new version) needs to be confirmed as the breaking change policy has
changed. A consensus is that if the violation is allowed in the same version , it's also allowed in the new version.

| Id Rule Name | Severity | Allowable level(same version or only new version) | comments |
| --- | --- | --- | --- |
| [1002 - ProtocolNoLongerSupported](rules/1002.md) |  Error |  Not sure |  |
| [1003 - RequestBodyFormatNoLongerSupported](rules/1003.md) | Error | Not sure | |
| [1004 - ResponseBodyFormatNowSupported](rules/1004.md) | Error | Not sure | |
| [1005 - RemovedPath](rules/1005.md)  | Error | breaking | |
| [1006 - RemovedDefinition](rules/1006.md) | Error | Not sure | |
| [1007 - RemovedClientParameter](rules/1007.md) | Error | Not sure | |
| [1008 - ModifiedOperationId](rules/1008.md)  | Error | Not sure | |
| [1009 - RemovedRequiredParameter](rules/1009.md) | Error | breaking |  |
| [1010 - AddingRequiredParameter](rules/1010.md) | Error | breaking | |
| [1011 - AddingResponseCode](rules/1011.md) | Error | Not sure | behavior |
| [1012 - RemovedResponseCode](rules/1012.md)| Error | Not sure | behavior change |
| [1013 - AddingHeader](rules/1013.md) | Error | Not sure | |
| [1014 - RemovingHeader](rules/1014.md)  | Error | Not sure | |
| [1015 - ParameterInHasChanged](rules/1015.md) | Error | Not sure | |
| [1016 - ConstantStatusHasChanged](rules/1016.md) | Error | Not sure | |
| [1017 - ReferenceRedirection](rules/1017.md)  | Error | Not sure | needs to compare after dereference |
| [1019 - RemovedEnumValue](rules/1019.md) | Error | breaking | |
| [1020 - AddedEnumValue](rules/1020.md)  | Error | breaking | Allowed in new api version , and needs to consider extensible enum is allowed in same version.
| [1021 - AddedAdditionalProperties](rules/1021.md) | Error | Not sure | |
| [1022 - RemovedAdditionalProperties](rules/1022.md) | Error | Not sure | |
| [1023 - TypeFormatChanged](rules/1023.md)   | Error | Not sure | allowed int64 -> int32 in response , and int32 -> int64 in request |
| [1024 - ConstraintIsStronger](rules/1024.md)  | Error | Not sure | |
| [1025 - RequiredStatusChange](rules/1025.md)  | Error | breaking | allowed required to optional in request in cross api version |
| [1026 - TypeChanged](rules/1026.md) | Error | breaking |  |
| [1027 - DefaultValueChanged](rules/1027.md) | Error | Not sure | | 
| [1028 - ArrayCollectionFormatChanged](rules/1028.md)  | Error | Not sure | |
| [1029 - ReadonlyPropertyChanged](rules/1029.md)  | Error | Not sure | * |
| [1030 - DifferentDiscriminator](rules/1030.md)  | Error | Not sure | |
| [1031 - DifferentExtends](rules/1031.md)  | Error | Not sure | |
| [1032 - DifferentAllOf](rules/1032.md)  | Error | Not sure | |
| [1033 - RemovedProperty](rules/1033.md)  | Error | breaking | both required and optional  |
| [1034 - AddedRequiredProperty](rules/1034.md)   | Error | breaking | |
| [1035 - RemovedOperation](rules/1035.md)  | Error | Not sure | |
| [1036 - ConstraintChanged](rules/1036.md)  | Error | Not sure | |
| [1037 - ConstraintIsWeaker](rules/1037.md)  | Error | Not sure | |
| [1038 - AddedPath](rules/1038.md)   | Info | New version | needs to meet the new policy |
| [1039 - AddedOperation](rules/1039.md)  | Info | New version |  needs to meet the new policy |
| [1040 - AddedReadOnlyPropertyInResponse](rules/1040.md)  | Info | Not sure | *the readonly property is optional property but can not be used by the request |
| [1041 - AddedPropertyInResponse](rules/1041.md)  | Error | New version | allowed in cross api versions |

## New Rules
- AddedXmsExtension, like: x-ms-client-name, x-ms-client-flatten