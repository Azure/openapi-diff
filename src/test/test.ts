import * as index from "../index"
import * as assert from "assert"
import * as path from "path"
import * as fs from "@ts-common/fs"

jest.setTimeout(10000)

describe("index", () => {
  it("simple", async () => {
    const diff = new index.OpenApiDiff({})
    const file = "src/test/simple/same.json"
    const resultStr = await diff.compare(file, file)
    const result = JSON.parse(resultStr)
    const filePath = path.resolve(file).split("\\").join("/")
    const expected = [
      {
        code: "NoVersionChange",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
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
    const diff = new index.OpenApiDiff({})
    const oldFile = "src/test/some-changes/old.json"
    const newFile = "src/test/some-changes/new.json"
    const resultStr = await diff.compare(oldFile, newFile)
    const result = JSON.parse(resultStr)
    const newFilePath = "file:///" + path.resolve(newFile).split("\\").join("/")
    const oldFilePath = "file:///" + path.resolve(oldFile).split("\\").join("/")
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
  it("full", async () => {
    const oldFile = "src/test/full/old/readme.md"
    const newFile = "src/test/full/new/readme.md"
    const diff = new index.OpenApiDiff({})
    const resultStr = await diff.compare(oldFile, newFile, "2019", "2019")
    const result = JSON.parse(resultStr)
    const newFilePath = "file:///" + path.resolve("src/test/full/new/openapi.json").split("\\").join("/")
    const newFilePath2 = "file:///" + path.resolve("src/test/full/new/openapi2.json").split("\\").join("/")
    const oldFilePath = "file:///" + path.resolve("src/test/full/old/openapi.json").split("\\").join("/")
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
          location: `${newFilePath2}:8:5`,
          path: "paths./x",
          ref: `${newFilePath2}#/paths/~1x`
        },
        old: {},
        type: "Info"
      }
    ]
    assert.deepStrictEqual(result, expected)
  })

  it("full reversed", async () => {
    const oldFile = "src/test/full/new/readme.md"
    const newFile = "src/test/full/old/readme.md"
    const diff = new index.OpenApiDiff({})
    const resultStr = await diff.compare(oldFile, newFile, "2019", "2019")
    const result = JSON.parse(resultStr)
    const oldFilePath = "file:///" + path.resolve("src/test/full/new/openapi.json").split("\\").join("/")
    const oldFilePath2 = "file:///" + path.resolve("src/test/full/new/openapi2.json").split("\\").join("/")
    const newFilePath = "file:///" + path.resolve("src/test/full/old/openapi.json").split("\\").join("/")
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
        code: "RemovedPath",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1005.md",
        id: "1005",
        message: "The new version is missing a path that was found in the old version. Was path '/x' removed or restructured?",
        mode: "Removal",
        old: {
          location: `${oldFilePath2}:8:5`,
          path: "paths./x",
          ref: `${oldFilePath2}#/paths/~1x`
        },
        new: {},
        type: "Error"
      }
    ]
    assert.deepStrictEqual(result, expected)
  })

  it("full2", async () => {

    const source = {
      url: "src/test/full2/source/readme.md",
      tag: "package-compute-only-2017-12"
    }

    const target = {
      url: "src/test/full2/target/readme.md",
      tag: "package-compute-2018-04"
    }

    const diff = new index.OpenApiDiff({})
    const resultStr = await diff.compare(source.url, target.url, source.tag, target.tag)
    const result: index.Messages = JSON.parse(resultStr)
    for (const v of result) {
      assert.deepStrictEqual(v.old.location !== undefined || v.new.location !== undefined, true)
    }
  })

  it("full2 reversed", async () => {

    const source = {
      url: "src/test/full2/target/readme.md",
      tag: "package-compute-2018-04"
    }

    const target = {
      url: "src/test/full2/source/readme.md",
      tag: "package-compute-only-2017-12"
    }

    const diff = new index.OpenApiDiff({})
    const resultStr = await diff.compare(source.url, target.url, source.tag, target.tag)
    const result: index.Messages = JSON.parse(resultStr)
    for (const v of result) {
      assert.deepStrictEqual(v.old.location !== undefined || v.new.location !== undefined, true)
    }
  })
})