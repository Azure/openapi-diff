import * as assert from "assert"
import * as path from "path"
import * as index from "../index"
import { fileUrl } from "./fileUrl"

test("xms-enum-name", async () => {
  const diff = new index.OpenApiDiff({})
  const oldFile = "src/test/xms-enum-name/old.json"
  const newFile = "src/test/xms-enum-name/new.json"
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
        path: "",
        location: `${newFilePath}:1:1`
      },
      old: {
        ref: `${oldFilePath}#`,
        path: "",
        location: `${oldFilePath}:1:1`
      },
      type: "Info"
    }
  ]
  assert.deepStrictEqual(result, expected)
})
