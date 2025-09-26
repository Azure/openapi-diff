# Changelog

## 0.12.2 2025-09-22

- bump dependency `js-yaml` from `^3.13.0` to `^4.1.0`
- pin pre-release dependencies
  - `@ts-common/fs` to `0.2.0`
  - `@ts-common/iterator` to `0.3.6`
  - `@ts-common/json` to `0.3.1`
  - `@ts-common/json-parser` to `0.9.0`
  - `@ts-common/source-map` to `0.5.0`
  - `@ts-common/string-map` to `0.3.0`
  - `json-pointer` to `0.6.2`
  - `source-map` to `0.7.6`
- remove unused dependencies
  - `acorn`
  - `kind-of`
  - `minimist`
  - `set-value`
  - `yargs-parser`

## 0.12.1 2025-09-18

- removed unused dependency 'glob'

## 0.12.0 2025-08-29

- replaced dependency 'request' with built-in fetch() API
- replaced child_process.exec() with execFile()
- require Node >= 20

## 0.11.0 2025-08-11

- upgraded Newtonsoft.Json from 9.0.1 to 13.0.1

## 0.10.14 2025-06-19

- escaped the input string when construct the autorest command

## 0.10.5 Released on 2024-02-16

- update source map version from 0.7.3 to 0.7.4 so that it works with Node 18.
- fix minor code issues that were blocking local run
- update docs

## 0.10.4 Released on 2023-01-10

- fix rule index & support additionalProperties:true

## 0.10.3 Released on 2022-11-29

- fix adding enum value & command line exception

## 0.10.2 Released on 2022-11-02

- bugfix for RequiredStatusChange

## 0.10.1 Released on 2022-10-15

- Bugfixes for ReferenceRedirection,AddedPropertyInResponse,DefaultValueChanged.

## 0.10.0 Released on 2022-09-15

- Added rules: AddedXmsEnum,RemovedXmsEnum,XmsEnumChanged.

## 0.9.7 Released on 2022-08-15

- change rule 'TypeChanged' to 'Info' if adding 'type:object' to an schema with "properties".

## 0.9.6 Released on 2022-06-09

- using autorest v3.6.1'.

## 0.9.3 Released on 2022-02-09

- bugfix for 'ConstraintIsStronger'.

## 0.9.2 Released on 2022-01-05

- bugfix for transforming path level parameters.

## 0.9.1 Released on 2021-07-26

- bugfix for rules -- 'addOptionalProperty' & 'ParameterInHasChanged'.

## 0.9.0 Released on 2021-07-21

- add new rule 'removedOptionalParameter'.
- bugfix for 'RequestBodyFormatNoLongerSupported' & 'ResponseBodyFormatNowSupported'
- upgrade dotnet core version from 2.0 to 3.1.

## 0.8.12 Released on 2021-06-25

- bug fix for checking circular allOf.
## 0.8.11 Released on 2021-05-31

- ConstraintIsWeaker & ConstraintIsStronger do not check adding/removing enum values.
- Always report AddedEnumValue/RemovedEnumValue no matter it's the context is in request or response.

## 0.8.10 Released on 2021-04-12

- Fixed bug: 'autorest' fails to acquire lock possibly due to running concurrently.

## 0.8.9 Released on 2021-04-08

- Fixed incompatible implementation with doc for 'XmsLongRunningOperationChanged'.

## 0.8.8 Released on 2021-03-19

- Fixed issue of rule 'AddedOptionalProperty'.

## 0.8.7 Released on 2021-02-24

- Add new rule - XmsLongRunningOperationChanged.
- Add new rule - AddedOptionalProperty.

## 0.8.6 Released on 2021-01-18

- Add new rule - AddingOptionalParameter.

## 0.8.5

- Fixed bug: multiple level 'allOf' comparing fails. 

## 0.8.4

- Add new rule ChangedParameter order.
- Expands "allOf" to compare.

## 0.8.2

- Fixed issue : Adding optional property to a model and the properties of the model is null, tool reports AddRequiredProperty.

## 0.8.1

- Fixed issue : can not find `node` path when running in pipeline.
- Fixed issue : can not find correct `autorest` path when When oad is installed globally.

## 0.8.0 Released on 2020-05-11

- Unify paths and x-ms-paths in the swagger then compare the unified swagger so that it consider not a breaking when you move a path from `paths` to `x-ms-path` without any other changes.

## 0.7.1 Released on 2020-04-21

- Fixed issue with common parameters.[#160](https://github.com/Azure/openapi-diff/pull/160)

## 0.6.3 Released on 2019-04-22

- Fixed autorest path.

## 0.5.2 Release on 2019-04-19.

- Fixed issue with null Enums.

## 0.5.0 Release on 2019-04-12.

- Update to TS 3.4 and 'types'.

## 0.4.3 Release on 2019-04-04.

- Fixed issue with `AddedPath`.

## 0.4.2 Release on 2019-04-03.

- Fixed issue with logging.

## 0.4.1 Release on 2019-04-03.

- Fixed issue with models that are not reference. [#136](https://github.com/Azure/openapi-diff/pull/136)

## 0.1.13 Released on 2019-01-03.

- Fixed security vulnerability issue reported in github. [#121](https://github.com/Azure/openapi-diff/pull/121)

## 0.1.12 Released on 2018-05-19.

- Added support for readme tags.

## 0.1.11 Released on 2018-05-14

- Fix crash on no operation parameters . [#86](https://github.com/Azure/openapi-diff/issues/86)

## 0.1.10 Released on 2018-03-15

- Fix crash when there are no required parameters. [#107](https://github.com/Azure/openapi-diff/issues/107)

## 0.1.9 Released on 2017-10-23

- Fix publishing issue of 0.1.8 where some dlls were missing.

## 0.1.8 Released on 2017-10-20

- Updating to use AutoRest 2. This solves [#105](https://github.com/Azure/openapi-diff/issues/105)

## 0.1.7 Released on 2017-08-10.

- Chaining the promises upto `compare` method and gracefully exiting application [#88](https://github.com/Azure/openapi-diff/issues/88)

## 0.1.x Released on 2017-07-18.

- All issues associated with this release can be found using this filter [Sprint-103](https://github.com/Azure/openapi-diff/issues?q=label%3ASprint-103+is%3Aclosed) [Sprint-104](https://github.com/Azure/openapi-diff/issues?utf8=%E2%9C%93&q=label%3ASprint-104%20is%3Aclosed)

## Added

- Initial release of oad.
