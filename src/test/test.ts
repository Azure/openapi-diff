import * as assert from "assert"
import * as path from "path"
import * as index from "../index"
import { fileUrl } from "./fileUrl"

test("xms-path", async () => {
  const diff = new index.OpenApiDiff({})
  const oldFile = "src/test/xmspath/old.json"
  const newFile = "src/test/xmspath/new.json"
  const resultStr = await diff.compare(oldFile, newFile)
  const result = JSON.parse(resultStr)
  const newFilePath = fileUrl(path.resolve(newFile))
  const oldFilePath = fileUrl(path.resolve(oldFile))
  const expected = [
    {
      code: "NoVersionChange",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
      id: "1001",
      message: "The versions have not changed.",
      mode: "Update",
      new: {
        ref: `${newFilePath}#`,
        location: `${newFilePath}:1:1`,
        path: ""
      },
      old: {
        ref: `${oldFilePath}#`,
        location: `${oldFilePath}:1:1`,
        path: ""
      },
      type: "Info"
    }
  ]
  assert.deepStrictEqual(result, expected)
})
test("expands allOf full covers", async () => {
  const diff = new index.OpenApiDiff({})
  const oldFile = "src/test/expandsAllOf/old/property_format_change.json"
  const newFile = "src/test/expandsAllOf/new/property_format_change.json"
  const resultStr = await diff.compare(oldFile, newFile)
  const result = JSON.parse(resultStr)
  const newFilePath = fileUrl(path.resolve(newFile))
  const oldFilePath = fileUrl(path.resolve(oldFile))
  const expected = [
    {
      id: "1001",
      code: "NoVersionChange",
      message: "The versions have not changed.",
      old: {
        ref: `${oldFilePath}#`,
        path: "",
        location: `${oldFilePath}:1:1`
      },
      new: {
        ref: `${newFilePath}#`,
        path: "",
        location: `${newFilePath}:1:1`
      },
      type: "Info",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
      mode: "Update"
    },
    {
      id: "1032",
      code: "DifferentAllOf",
      message: "The new version has a different 'allOf' property than the previous one.",
      old: {
        ref: `${oldFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
        path: "paths./api/Parameters.put.parameters[0].schema",
        location: `${oldFilePath}:22:13`
      },
      new: {
        ref: `${newFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
        path: "paths./api/Parameters.put.parameters[0].schema",
        location: `${newFilePath}:22:13`
      },
      type: "Error",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
      mode: "Update"
    },
    {
      code: "RequiredStatusChange",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1025.md",
      id: "1025",
      message: "The 'required' status changed from the old version('False') to the new version('True').",
      mode: "Update",
      new: {
        location: `${newFilePath}:35:7`,
        path: "definitions.Database.properties",
        ref: `${newFilePath}#/definitions/Database/properties`
      },
      old: {
        location: `${oldFilePath}:35:7`,
        path: "definitions.Database.properties",
        ref: `${oldFilePath}#/definitions/Database/properties`
      },
      type: "Error"
    },
    {
      id: "1026",
      code: "TypeChanged",
      message: "The new version has a different type 'string' than the previous one 'integer'.",
      old: {
        ref: `${oldFilePath}#/definitions/DataBaseProperties/properties/b`,
        path: "definitions.Database.properties.b",
        location: `${oldFilePath}:47:9`
      },
      new: {
        ref: `${newFilePath}#/definitions/Database/properties/b`,
        path: "definitions.Database.properties.b",
        location: `${newFilePath}:41:9`
      },
      type: "Error",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1026.md",
      mode: "Update"
    },
    {
      id: "1023",
      code: "TypeFormatChanged",
      message: "The new version has a different format than the previous one.",
      old: {
        ref: `${oldFilePath}#/definitions/DataBaseProperties/properties/b`,
        path: "definitions.Database.properties.b",
        location: `${oldFilePath}:47:9`
      },
      new: {
        ref: `${newFilePath}#/definitions/Database/properties/b`,
        path: "definitions.Database.properties.b",
        location: `${newFilePath}:41:9`
      },
      type: "Error",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1023.md",
      mode: "Update"
    },
    {
      id: "1034",
      code: "AddedRequiredProperty",
      message: "The new version has new required property 'a' that was not found in the old version.",
      old: {
        ref: `${oldFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
        path: "paths./api/Parameters.put.parameters[0].schema",
        location: `${oldFilePath}:22:13`
      },
      new: {
        ref: `${newFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
        path: "paths./api/Parameters.put.parameters[0].schema",
        location: `${newFilePath}:22:13`
      },
      type: "Error",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1034.md",
      mode: "Addition"
    },
    {
      code: "DifferentAllOf",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
      id: "1032",
      message: "The new version has a different 'allOf' property than the previous one.",
      mode: "Update",
      new: {
        location: `${newFilePath}:34:5`,
        path: "definitions.Database",
        ref: `${newFilePath}#/definitions/Database`
      },
      old: {
        location: `${oldFilePath}:34:5`,
        path: "definitions.Database",
        ref: `${oldFilePath}#/definitions/Database`
      },
      type: "Error"
    },
    {
      id: "1034",
      code: "AddedRequiredProperty",
      message: "The new version has new required property 'a' that was not found in the old version.",
      old: {
        ref: `${oldFilePath}#/definitions/Database`,
        path: "definitions.Database",
        location: `${oldFilePath}:34:5`
      },
      new: {
        ref: `${newFilePath}#/definitions/Database`,
        path: "definitions.Database",
        location: `${newFilePath}:34:5`
      },
      type: "Error",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1034.md",
      mode: "Addition"
    }
  ]
  assert.deepStrictEqual(result, expected)
})
test("expands allOf Models", async () => {
  const diff = new index.OpenApiDiff({})
  const oldFile = "src/test/expandsAllOf/old/expand_allOf_model.json"
  const newFile = "src/test/expandsAllOf/new/expand_allOf_model.json"
  const resultStr = await diff.compare(oldFile, newFile)
  const result = JSON.parse(resultStr)
  const newFilePath = fileUrl(path.resolve(newFile))
  const oldFilePath = fileUrl(path.resolve(oldFile))
  const expected = [
    {
      id: "1001",
      code: "NoVersionChange",
      message: "The versions have not changed.",
      old: {
        ref: `${oldFilePath}#`,
        path: "",
        location: `${oldFilePath}:1:1`
      },
      new: {
        ref: `${newFilePath}#`,
        path: "",
        location: `${newFilePath}:1:1`
      },
      type: "Info",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
      mode: "Update"
    },
    {
      id: "1032",
      code: "DifferentAllOf",
      message: "The new version has a different 'allOf' property than the previous one.",
      old: {
        ref: `${oldFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
        path: "paths./api/Parameters.put.parameters[0].schema",
        location: `${oldFilePath}:24:13`
      },
      new: {
        ref: `${newFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
        path: "paths./api/Parameters.put.parameters[0].schema",
        location: `${newFilePath}:24:13`
      },
      type: "Error",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
      mode: "Update"
    },
    {
      code: "DifferentAllOf",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
      id: "1032",
      message: "The new version has a different 'allOf' property than the previous one.",
      mode: "Update",
      new: {
        location: `${newFilePath}:36:5`,
        path: "definitions.Database",
        ref: `${newFilePath}#/definitions/Database`
      },
      old: {
        location: `${oldFilePath}:36:5`,
        path: "definitions.Database",
        ref: `${oldFilePath}#/definitions/Database`
      },
      type: "Error"
    }
  ]
  assert.deepStrictEqual(result, expected)
})
test("Move into allOf Models", async () => {
  const diff = new index.OpenApiDiff({})
  const oldFile = "src/test/expandsAllOf/old/move_properties_into_allof_model.json"
  const newFile = "src/test/expandsAllOf/new/move_properties_into_allof_model.json"
  const resultStr = await diff.compare(oldFile, newFile)
  const result = JSON.parse(resultStr)
  const newFilePath = fileUrl(path.resolve(newFile))
  const oldFilePath = fileUrl(path.resolve(oldFile))
  const expected = [
    {
      id: "1001",
      code: "NoVersionChange",
      message: "The versions have not changed.",
      old: {
        ref: `${oldFilePath}#`,
        path: "",
        location: `${oldFilePath}:1:1`
      },
      new: {
        ref: `${newFilePath}#`,
        path: "",
        location: `${newFilePath}:1:1`
      },
      type: "Info",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
      mode: "Update"
    },
    {
      id: "1032",
      code: "DifferentAllOf",
      message: "The new version has a different 'allOf' property than the previous one.",
      old: {
        ref: `${oldFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
        path: "paths./api/Parameters.put.parameters[0].schema",
        location: `${oldFilePath}:24:13`
      },
      new: {
        ref: `${newFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
        path: "paths./api/Parameters.put.parameters[0].schema",
        location: `${newFilePath}:24:13`
      },
      type: "Error",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
      mode: "Update"
    },
    {
      code: "DifferentAllOf",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
      id: "1032",
      message: "The new version has a different 'allOf' property than the previous one.",
      mode: "Update",
      new: {
        location: `${newFilePath}:36:5`,
        path: "definitions.Database",
        ref: `${newFilePath}#/definitions/Database`
      },
      old: {
        location: `${oldFilePath}:36:5`,
        path: "definitions.Database",
        ref: `${oldFilePath}#/definitions/Database`
      },
      type: "Error"
    }
  ]
  assert.deepStrictEqual(result, expected)
})
test("Multiple Level AllOf", async () => {
  const diff = new index.OpenApiDiff({})
  const oldFile = "src/test/expandsAllOf/old/multi_level_allOf.json"
  const newFile = "src/test/expandsAllOf/new/multi_level_allOf.json"
  const resultStr = await diff.compare(oldFile, newFile)
  const result = JSON.parse(resultStr)
  const newFilePath = fileUrl(path.resolve(newFile))
  const oldFilePath = fileUrl(path.resolve(oldFile))
  const expected = [
    {
      id: "1001",
      code: "NoVersionChange",
      message: "The versions have not changed.",
      old: {
        ref: `${oldFilePath}#`,
        path: "",
        location: `${oldFilePath}:1:1`
      },
      new: {
        ref: `${newFilePath}#`,
        path: "",
        location: `${newFilePath}:1:1`
      },
      type: "Info",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
      mode: "Update"
    },
    {
      id: "1032",
      code: "DifferentAllOf",
      message: "The new version has a different 'allOf' property than the previous one.",
      old: {
        ref: `${oldFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
        path: "paths./api/Parameters.put.parameters[0].schema",
        location: `${oldFilePath}:24:13`
      },
      new: {
        ref: `${newFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
        path: "paths./api/Parameters.put.parameters[0].schema",
        location: `${newFilePath}:24:13`
      },
      type: "Error",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
      mode: "Update"
    },
    {
      code: "DifferentAllOf",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
      id: "1032",
      message: "The new version has a different 'allOf' property than the previous one.",
      mode: "Update",
      new: {
        location: `${newFilePath}:36:5`,
        path: "definitions.Database",
        ref: `${newFilePath}#/definitions/Database`
      },
      old: {
        location: `${oldFilePath}:36:5`,
        path: "definitions.Database",
        ref: `${oldFilePath}#/definitions/Database`
      },
      type: "Error"
    }
  ]
  assert.deepStrictEqual(result, expected)
})
test("flags 1003 - RequestBodyFormatNoLongerSupported", async () => {
  const diff = new index.OpenApiDiff({})
  const oldFile = "src/test/rule-1003/case1.old.json"
  const newFile = "src/test/rule-1003/case1.new.json"
  const resultStr = await diff.compare(oldFile, newFile)
  const result = JSON.parse(resultStr)
  const newFilePath = fileUrl(path.resolve(newFile))
  const oldFilePath = fileUrl(path.resolve(oldFile))
  const expected = [
    {
      id: "1003",
      code: "RequestBodyFormatNoLongerSupported",
      message: "The new version does not support 'text/plain' as a request body format.",
      mode: "Removal",
      old: {
        ref: `${oldFilePath}#/consumes`,
        path: "paths./pets.post.consumes",
        location: `${oldFilePath}:7:3`
      },
      new: {
        ref: `${newFilePath}#/consumes`,
        path: "paths./pets.post.consumes",
        location: `${newFilePath}:7:3`
      },
      type: "Warning",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1003.md"
    }
  ]
  assert.deepStrictEqual(result, expected)
})
test("flags 1004 - ResponseBodyFormatNowSupported", async () => {
  const diff = new index.OpenApiDiff({})
  const oldFile = "src/test/rule-1004/case1.old.json"
  const newFile = "src/test/rule-1004/case1.new.json"
  const resultStr = await diff.compare(oldFile, newFile)
  const result = JSON.parse(resultStr)
  const newFilePath = fileUrl(path.resolve(newFile))
  const oldFilePath = fileUrl(path.resolve(oldFile))
  const expected = [
    {
      id: "1004",
      code: "ResponseBodyFormatNowSupported",
      message: "The old version did not support 'text/plain' as a response body format.",
      mode: "Addition",
      old: {
        ref: `${oldFilePath}#/produces`,
        path: "paths./pets.get.produces",
        location: `${oldFilePath}:7:3`
      },
      new: {
        ref: `${newFilePath}#/produces`,
        path: "paths./pets.get.produces",
        location: `${newFilePath}:7:3`
      },
      type: "Warning",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1004.md"
    }
  ]
  assert.deepStrictEqual(result, expected)
})

test("Additional Properties is boolean", async () => {
  const diff = new index.OpenApiDiff({})
  const oldFile = "src/test/additional-properties/old.json"
  const newFile = "src/test/additional-properties/new.json"
  const resultStr = await diff.compare(oldFile, newFile)
  const result = JSON.parse(resultStr)
  const newFilePath = fileUrl(path.resolve(newFile))
  const oldFilePath = fileUrl(path.resolve(oldFile))
  const expected = [
    {
      id: "1001",
      code: "NoVersionChange",
      message: "The versions have not changed.",
      old: {
        ref: `${oldFilePath}#`,
        path: "",
        location: `${oldFilePath}:1:1`
      },
      new: {
        ref: `${newFilePath}#`,
        path: "",
        location: `${newFilePath}:1:1`
      },
      type: "Info",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
      mode: "Update"
    },
    {
      code: "AddedAdditionalProperties",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1021.md",
      id: "1021",
      message: "The new version adds an 'additionalProperties' element.",
      mode: "Addition",
      new: {
        location: ``,
        path: "paths./api/Operations.get.parameters",
        ref: ``
      },
      old: {},
      type: "Error"
    },
    {
      code: "AddedAdditionalProperties",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1021.md",
      id: "1021",
      message: "The new version adds an 'additionalProperties' element.",
      mode: "Addition",
      new: {
        location: `${newFilePath}:16:7`,
        path: "parameters.P2.schema",
        ref: `${newFilePath}#/parameters/P2/schema`
      },
      old: {
        location: `${oldFilePath}:16:7`,
        path: "parameters.P2.schema",
        ref: `${oldFilePath}#/parameters/P2/schema`
      },
      type: "Error"
    }
  ]
  assert.deepStrictEqual(result, expected)
})
