import * as assert from "assert"
import * as path from "path"
import { OpenApiDiff } from ".."
import { fileUrl } from "./fileUrl"

test("Additional Properties is boolean", async () => {
  const diff = new OpenApiDiff({})
  const oldFile = "src/test/specs/additional-properties/old.json"
  const newFile = "src/test/specs/additional-properties/new.json"
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
