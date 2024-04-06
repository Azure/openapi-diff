import * as assert from "assert"
import * as path from "path"
import { OpenApiDiff } from ".."
import { fileUrl } from "./fileUrl"

test("expands allOf Models", async () => {
  const diff = new OpenApiDiff({})
  const oldFile = "src/test/specs/expandsAllOf/old/expand_allOf_model.json"
  const newFile = "src/test/specs/expandsAllOf/new/expand_allOf_model.json"
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
