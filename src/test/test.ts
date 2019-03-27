import * as index from "../index"
import * as assert from "assert"
import * as path from "path"

jest.setTimeout(10000)

describe("index", () => {
  it("simple", async () => {
    const diff = new index.OpenApiDiff({ json: true })
    const file = "src/test/simple/same.json"
    const resultStr = await diff.compare(file, file)
    const result = JSON.parse(resultStr)
    const filePath = path.resolve(file).split("\\").join("/")
    const expected = [
      {
        code: "NoVersionChange",
        docurl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
        id: "1001",
        message: "The versions have not changed.",
        mode: "Update",
        new: {
          ref: `file:///${filePath}#`,
          path: "",
          location: `file:///${filePath}:1:1`
        },
        old: {
          ref: `file:///${filePath}#`,
          path: "",
          location: `file:///${filePath}:1:1`
        },
        type: "Info"
      }
    ]
    assert.deepStrictEqual(result, expected)
  })
  it("some-changes", async () => {
    const diff = new index.OpenApiDiff({ json: true })
    const oldFile = "src/test/some-changes/old.json"
    const newFile = "src/test/some-changes/new.json"
    const resultStr = await diff.compare(oldFile, newFile)
    const result = JSON.parse(resultStr)
    const newFilePath = "file:///" + path.resolve(newFile).split("\\").join("/")
    const oldFilePath = "file:///" + path.resolve(oldFile).split("\\").join("/")
    const expected = [
      {
        code: "NoVersionChange",
        docurl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
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
        docurl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1038.md",
        id: "1038",
        message: "The new version is adding a path that was not found in the old version.",
        mode: "Addition",
        new: {
          location: `${newFilePath}:8:5`,
          path: "paths./x",
          ref: `${newFilePath}#/paths/~1x`
        },
        old:
        {
          ref: "C:/Users/sergey/AppData/Local/Temp/old.json#/paths/~1x"
        },
        type: "Info"
      }
    ]
    assert.deepStrictEqual(result, expected)
  })
})