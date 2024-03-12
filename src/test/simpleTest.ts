import * as assert from "assert"
import * as path from "path"
import * as index from "../index"
import { fileUrl } from "./fileUrl"

test("simple", async () => {
  const diff = new index.OpenApiDiff({})
  const file = "src/test/simple/same.json"
  const resultStr = await diff.compare(file, file)
  const result = JSON.parse(resultStr)
  const filePath = fileUrl(path.resolve(file))
  const expected = [
    {
      code: "NoVersionChange",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
      id: "1001",
      message: "The versions have not changed.",
      mode: "Update",
      new: {
        ref: `${filePath}#`,
        path: "",
        location: `${filePath}:1:1`
      },
      old: {
        ref: `${filePath}#`,
        path: "",
        location: `${filePath}:1:1`
      },
      type: "Info"
    }
  ]
  assert.deepStrictEqual(result, expected)
})
