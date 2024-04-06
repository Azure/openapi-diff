import * as assert from "assert"
import * as path from "path"
import { OpenApiDiff } from ".."
import { fileUrl } from "./fileUrl"

// This test is part of regression test suite for https://github.com/Azure/azure-sdk-tools/issues/5981
// Given a property with given type and name
// When another property with the same name and compatible type is referenced
// Then no issue is reported, as this is a valid scenario
test("compatible-properties", async () => {
  const diff = new OpenApiDiff({})
  const file = "src/test/specs/compatible-properties.json"
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
