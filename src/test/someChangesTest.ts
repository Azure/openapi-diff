import * as assert from "assert"
import * as path from "path"
import { OpenApiDiff } from ".."
import { fileUrl } from "./fileUrl"

test("some-changes", async () => {
  const diff = new OpenApiDiff({})
  const oldFile = "src/test/specs/some-changes/old.json"
  const newFile = "src/test/specs/some-changes/new.json"
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
        location: `${newFilePath}:8:5`,
        path: "paths./x",
        ref: `${newFilePath}#/paths/~1x`
      },
      old: {},
      type: "Info"
    }
  ]
  assert.deepStrictEqual(result, expected)
})
