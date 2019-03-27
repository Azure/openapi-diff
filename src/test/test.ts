import * as index from "../index"
import * as assert from "assert"
import * as path from "path"

jest.setTimeout(10000)

describe("index", () => {
  it("simple", async () => {
    const diff = new index.OpenApiDiff({ json: true })
    const resultStr = await diff.compare("src/test/simple/same.json", "src/test/simple/same.json")
    const result = JSON.parse(resultStr)
    const expected = [
      {
        code: "NoVersionChange",
        docurl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
        id: "1001",
        message: "The versions have not changed.",
        mode: "Update",
        new: {
          ref: "C:/Users/sergey/AppData/Local/Temp/new.json#"
        },
        old: {
          ref: "C:/Users/sergey/AppData/Local/Temp/old.json#"
        },
        type: "Info"
      }
    ]
    assert.deepStrictEqual(result, expected)
  })
  it("some-changes", async () => {
    const diff = new index.OpenApiDiff({ json: true })
    const newFile = "src/test/some-changes/new.json"
    const resultStr = await diff.compare("src/test/some-changes/old.json", newFile)
    const result = JSON.parse(resultStr)
    const newFilePath = path.resolve(newFile).split("\\").join("/")
    const expected = [
      {
        code: "NoVersionChange",
        docurl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
        id: "1001",
        message: "The versions have not changed.",
        mode: "Update",
        new: {
          ref: "C:/Users/sergey/AppData/Local/Temp/new.json#"
        },
        old: {
          ref: "C:/Users/sergey/AppData/Local/Temp/old.json#"
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
          location: `file:///${newFilePath}:8:5`,
          path: "paths./x",
          ref: `file:///${newFilePath}#/paths/~1x`
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