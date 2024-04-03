import * as assert from "assert"
import * as path from "path"
import { OpenApiDiff } from ".."
import { fileUrl } from "./fileUrl"

test("xms-path", async () => {
  const diff = new OpenApiDiff({})
  const oldFile = "src/test/specs/xmspath/old.json"
  const newFile = "src/test/specs/xmspath/new.json"
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
      code: "AddedPath",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1038.md",
      id: "1038",
      message: "The new version is adding a path that was not found in the old version.",
      mode: "Addition",
      new: {
        ref: `${newFilePath}#/x-ms-paths/?does-not-start-with-slash`,
        location: `${newFilePath}:44:5`,
        path: "paths.?does-not-start-with-slash"
      },
      old: {},
      type: "Info"
    }
  ]
  assert.deepStrictEqual(result, expected)
})
