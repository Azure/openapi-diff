import * as assert from "assert"
import * as path from "path"
import { OpenApiDiff } from ".."
import { fileUrl } from "./fileUrl"

test("common-parameters", async () => {
  const diff = new OpenApiDiff({})
  const oldFile = "src/test/specs/common-parameters/old.json"
  const newFile = "src/test/specs/common-parameters/new.json"
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
    },
    {
      code: "RemovedOptionalParameter",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1046.md",
      id: "1046",
      message: "The optional parameter 'p1' was removed in the new version.",
      mode: "Removal",
      new: {},
      old: {
        location: "",
        path: "paths./api/Operations.get.parameters",
        ref: ""
      },
      type: "Error"
    },
    {
      code: "AddingOptionalParameter",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1043.md",
      id: "1043",
      message: "The optional parameter 'p2' was added in the new version.",
      mode: "Addition",
      new: {
        location: "",
        path: "paths./api/Operations.get.parameters",
        ref: ""
      },
      old: {},
      type: "Error"
    },
    {
      code: "RemovedClientParameter",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1007.md",
      id: "1007",
      message: "The new version is missing a client parameter that was found in the old version. Was 'P1' removed or renamed?",
      mode: "Removal",
      new: {
        location: `${newFilePath}:7:3`,
        path: "parameters",
        ref: `${newFilePath}#/parameters`
      },
      old: {
        location: `${oldFilePath}:7:3`,
        path: "parameters",
        ref: `${oldFilePath}#/parameters`
      },
      type: "Error"
    }
  ]
  assert.deepStrictEqual(result, expected)
})
