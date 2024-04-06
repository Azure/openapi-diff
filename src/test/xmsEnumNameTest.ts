import * as assert from "assert"
import * as path from "path"
import { OpenApiDiff } from ".."
import { fileUrl } from "./fileUrl"

test("xms-enum-name", async () => {
  const diff = new OpenApiDiff({})
  const oldFile = "src/test/specs/xms-enum-name/old.json"
  const newFile = "src/test/specs/xms-enum-name/new.json"
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
    },
    {
      code: "XmsEnumChanged",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1047.md",
      id: "1047",
      message: "The new version has a different x-ms-enum 'name' than the previous one.",
      mode: "Update",
      new: {
        ref: `${newFilePath}#/definitions/Foo/properties/bar`,
        path: "definitions.Foo.properties.bar",
        location: `${newFilePath}:13:9`
      },
      old: {
        ref: `${oldFilePath}#/definitions/Foo/properties/bar`,
        path: "definitions.Foo.properties.bar",
        location: `${oldFilePath}:13:9`
      },
      type: "Error"
    }
  ]
  assert.deepStrictEqual(result, expected)
})
