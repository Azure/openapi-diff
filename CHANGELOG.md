# Changelog

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
