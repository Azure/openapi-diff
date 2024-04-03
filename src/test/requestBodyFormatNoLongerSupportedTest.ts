import * as assert from "assert"
import * as path from "path"
import { OpenApiDiff } from ".."
import { fileUrl } from "./fileUrl"

test("flags 1003 - RequestBodyFormatNoLongerSupported", async () => {
  const diff = new OpenApiDiff({})
  const oldFile = "src/test/specs/rule-1003/case1.old.json"
  const newFile = "src/test/specs/rule-1003/case1.new.json"
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
