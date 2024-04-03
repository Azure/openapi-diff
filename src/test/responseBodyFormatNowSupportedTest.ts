import { deepStrictEqual } from "assert"
import { resolve } from "path"
import { OpenApiDiff } from ".."
import { fileUrl } from "./fileUrl"

test("flags 1004 - ResponseBodyFormatNowSupported", async () => {
  const diff = new OpenApiDiff({})
  const oldFile = "src/test/specs/rule-1004/case1.old.json"
  const newFile = "src/test/specs/rule-1004/case1.new.json"
  const resultStr = await diff.compare(oldFile, newFile)
  const result = JSON.parse(resultStr)
  const newFilePath = fileUrl(resolve(newFile))
  const oldFilePath = fileUrl(resolve(oldFile))
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
  deepStrictEqual(result, expected)
})
