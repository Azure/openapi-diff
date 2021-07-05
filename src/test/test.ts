import * as assert from "assert"
import * as path from "path"
import * as index from "../index"

jest.setTimeout(100000)

const fileUrl = (absPath: string) => {
  return "file:///" + absPath.replace(/^\//, "").split("\\").join("/")
}

describe("index", () => {
  it("simple", async () => {
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
  it("some-changes", async () => {
    const diff = new index.OpenApiDiff({})
    const oldFile = "src/test/some-changes/old.json"
    const newFile = "src/test/some-changes/new.json"
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
  it("full", async () => {
    const oldFile = "src/test/full/old/readme.md"
    const newFile = "src/test/full/new/readme.md"
    const diff = new index.OpenApiDiff({})
    const resultStr = await diff.compare(oldFile, newFile, "2019", "2019")
    const result = JSON.parse(resultStr)
    const newFilePath = fileUrl(path.resolve("src/test/full/new/openapi.json").replace(/^\//, ""))
    const newFilePath2 = fileUrl(path.resolve("src/test/full/new/openapi2.json"))
    const oldFilePath = fileUrl(path.resolve("src/test/full/old/openapi.json"))
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
    const oldFilePath = fileUrl(path.resolve("src/test/full/new/openapi.json"))
    const oldFilePath2 = fileUrl(path.resolve("src/test/full/new/openapi2.json"))
    const newFilePath = fileUrl(path.resolve("src/test/full/old/openapi.json"))
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

  it("common-parameters", async () => {
    const diff = new index.OpenApiDiff({})
    const oldFile = "src/test/common-parameters/old.json"
    const newFile = "src/test/common-parameters/new.json"
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
        code: "RemovedClientParameter",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1007.md",
        id: "1007",
        message: "The new version is missing a client parameter that was found in the old version. Was 'P1' removed or renamed?",
        mode: "Removal",
        new: {
          location: `${newFilePath}:7:3`,
          path: "parameters",
          ref: `${newFilePath}#/parameters`
        },
        old: {
          location: `${oldFilePath}:7:3`,
          path: "parameters",
          ref: `${oldFilePath}#/parameters`
        },
        type: "Error"
      }
    ]
    assert.deepStrictEqual(result, expected)
  })

  it("xms-path", async () => {
    const diff = new index.OpenApiDiff({})
    const oldFile = "src/test/xmspath/old.json"
    const newFile = "src/test/xmspath/new.json"
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
      }
    ]
    assert.deepStrictEqual(result, expected)
  })
  it("expands allOf full covers", async () => {
    const diff = new index.OpenApiDiff({})
    const oldFile = "src/test/expandsAllOf/old/property_format_change.json"
    const newFile = "src/test/expandsAllOf/new/property_format_change.json"
    const resultStr = await diff.compare(oldFile, newFile)
    const result = JSON.parse(resultStr)
    const newFilePath = fileUrl(path.resolve(newFile))
    const oldFilePath = fileUrl(path.resolve(oldFile))
    const expected = [
      {
        id: "1001",
        code: "NoVersionChange",
        message: "The versions have not changed.",
        old: {
          ref: `${oldFilePath}#`,
          path: "",
          location: `${oldFilePath}:1:1`
        },
        new: {
          ref: `${newFilePath}#`,
          path: "",
          location: `${newFilePath}:1:1`
        },
        type: "Info",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
        mode: "Update"
      },
      {
        id: "1032",
        code: "DifferentAllOf",
        message: "The new version has a different 'allOf' property than the previous one.",
        old: {
          ref: `${oldFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
          path: "paths./api/Parameters.put.parameters[0].schema",
          location: `${oldFilePath}:22:13`
        },
        new: {
          ref: `${newFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
          path: "paths./api/Parameters.put.parameters[0].schema",
          location: `${newFilePath}:22:13`
        },
        type: "Error",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
        mode: "Update"
      },
      {
        id: "1026",
        code: "TypeChanged",
        message: "The new version has a different type 'string' than the previous one 'integer'.",
        old: {
          ref: `${oldFilePath}#/definitions/DataBaseProperties/properties/b`,
          path: "definitions.Database.properties.b",
          location: `${oldFilePath}:47:9`
        },
        new: {
          ref: `${newFilePath}#/definitions/Database/properties/b`,
          path: "definitions.Database.properties.b",
          location: `${newFilePath}:41:9`
        },
        type: "Error",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1026.md",
        mode: "Update"
      },
      {
        id: "1023",
        code: "TypeFormatChanged",
        message: "The new version has a different format than the previous one.",
        old: {
          ref: `${oldFilePath}#/definitions/DataBaseProperties/properties/b`,
          path: "definitions.Database.properties.b",
          location: `${oldFilePath}:47:9`
        },
        new: {
          ref: `${newFilePath}#/definitions/Database/properties/b`,
          path: "definitions.Database.properties.b",
          location: `${newFilePath}:41:9`
        },
        type: "Error",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1023.md",
        mode: "Update"
      },
      {
        id: "1034",
        code: "AddedRequiredProperty",
        message: "The new version has new required property 'a' that was not found in the old version.",
        old: {
          ref: `${oldFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
          path: "paths./api/Parameters.put.parameters[0].schema",
          location: `${oldFilePath}:22:13`
        },
        new: {
          ref: `${newFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
          path: "paths./api/Parameters.put.parameters[0].schema",
          location: `${newFilePath}:22:13`
        },
        type: "Error",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1034.md",
        mode: "Addition"
      },
      {
        code: "DifferentAllOf",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
        id: "1032",
        message: "The new version has a different 'allOf' property than the previous one.",
        mode: "Update",
        new: {
          location: `${newFilePath}:34:5`,
          path: "definitions.Database",
          ref: `${newFilePath}#/definitions/Database`
        },
        old: {
          location: `${oldFilePath}:34:5`,
          path: "definitions.Database",
          ref: `${oldFilePath}#/definitions/Database`
        },
        type: "Error"
      },
      {
        id: "1034",
        code: "AddedRequiredProperty",
        message: "The new version has new required property 'a' that was not found in the old version.",
        old: {
          ref: `${oldFilePath}#/definitions/Database`,
          path: "definitions.Database",
          location: `${oldFilePath}:34:5`
        },
        new: {
          ref: `${newFilePath}#/definitions/Database`,
          path: "definitions.Database",
          location: `${newFilePath}:34:5`
        },
        type: "Error",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1034.md",
        mode: "Addition"
      }
    ]
    assert.deepStrictEqual(result, expected)
  })
  it("expands allOf Models", async () => {
    const diff = new index.OpenApiDiff({})
    const oldFile = "src/test/expandsAllOf/old/expand_allOf_model.json"
    const newFile = "src/test/expandsAllOf/new/expand_allOf_model.json"
    const resultStr = await diff.compare(oldFile, newFile)
    const result = JSON.parse(resultStr)
    const newFilePath = fileUrl(path.resolve(newFile))
    const oldFilePath = fileUrl(path.resolve(oldFile))
    const expected = [
      {
        id: "1001",
        code: "NoVersionChange",
        message: "The versions have not changed.",
        old: {
          ref: `${oldFilePath}#`,
          path: "",
          location: `${oldFilePath}:1:1`
        },
        new: {
          ref: `${newFilePath}#`,
          path: "",
          location: `${newFilePath}:1:1`
        },
        type: "Info",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
        mode: "Update"
      },
      {
        id: "1032",
        code: "DifferentAllOf",
        message: "The new version has a different 'allOf' property than the previous one.",
        old: {
          ref: `${oldFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
          path: "paths./api/Parameters.put.parameters[0].schema",
          location: `${oldFilePath}:24:13`
        },
        new: {
          ref: `${newFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
          path: "paths./api/Parameters.put.parameters[0].schema",
          location: `${newFilePath}:24:13`
        },
        type: "Error",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
        mode: "Update"
      },
      {
        code: "DifferentAllOf",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
        id: "1032",
        message: "The new version has a different 'allOf' property than the previous one.",
        mode: "Update",
        new: {
          location: `${newFilePath}:36:5`,
          path: "definitions.Database",
          ref: `${newFilePath}#/definitions/Database`
        },
        old: {
          location: `${oldFilePath}:36:5`,
          path: "definitions.Database",
          ref: `${oldFilePath}#/definitions/Database`
        },
        type: "Error"
      }
    ]
    assert.deepStrictEqual(result, expected)
  })
  it("Move into allOf Models", async () => {
    const diff = new index.OpenApiDiff({})
    const oldFile = "src/test/expandsAllOf/old/move_properties_into_allof_model.json"
    const newFile = "src/test/expandsAllOf/new/move_properties_into_allof_model.json"
    const resultStr = await diff.compare(oldFile, newFile)
    const result = JSON.parse(resultStr)
    const newFilePath = fileUrl(path.resolve(newFile))
    const oldFilePath = fileUrl(path.resolve(oldFile))
    const expected = [
      {
        id: "1001",
        code: "NoVersionChange",
        message: "The versions have not changed.",
        old: {
          ref: `${oldFilePath}#`,
          path: "",
          location: `${oldFilePath}:1:1`
        },
        new: {
          ref: `${newFilePath}#`,
          path: "",
          location: `${newFilePath}:1:1`
        },
        type: "Info",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
        mode: "Update"
      },
      {
        id: "1032",
        code: "DifferentAllOf",
        message: "The new version has a different 'allOf' property than the previous one.",
        old: {
          ref: `${oldFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
          path: "paths./api/Parameters.put.parameters[0].schema",
          location: `${oldFilePath}:24:13`
        },
        new: {
          ref: `${newFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
          path: "paths./api/Parameters.put.parameters[0].schema",
          location: `${newFilePath}:24:13`
        },
        type: "Error",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
        mode: "Update"
      },
      {
        code: "DifferentAllOf",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
        id: "1032",
        message: "The new version has a different 'allOf' property than the previous one.",
        mode: "Update",
        new: {
          location: `${newFilePath}:36:5`,
          path: "definitions.Database",
          ref: `${newFilePath}#/definitions/Database`
        },
        old: {
          location: `${oldFilePath}:36:5`,
          path: "definitions.Database",
          ref: `${oldFilePath}#/definitions/Database`
        },
        type: "Error"
      }
    ]
    assert.deepStrictEqual(result, expected)
  })
  it("Multiple Level AllOf", async () => {
    const diff = new index.OpenApiDiff({})
    const oldFile = "src/test/expandsAllOf/old/multi_level_allOf.json"
    const newFile = "src/test/expandsAllOf/new/multi_level_allOf.json"
    const resultStr = await diff.compare(oldFile, newFile)
    const result = JSON.parse(resultStr)
    const newFilePath = fileUrl(path.resolve(newFile))
    const oldFilePath = fileUrl(path.resolve(oldFile))
    const expected = [
      {
        id: "1001",
        code: "NoVersionChange",
        message: "The versions have not changed.",
        old: {
          ref: `${oldFilePath}#`,
          path: "",
          location: `${oldFilePath}:1:1`
        },
        new: {
          ref: `${newFilePath}#`,
          path: "",
          location: `${newFilePath}:1:1`
        },
        type: "Info",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
        mode: "Update"
      },
      {
        id: "1032",
        code: "DifferentAllOf",
        message: "The new version has a different 'allOf' property than the previous one.",
        old: {
          ref: `${oldFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
          path: "paths./api/Parameters.put.parameters[0].schema",
          location: `${oldFilePath}:24:13`
        },
        new: {
          ref: `${newFilePath}#/paths/~1api~1Parameters/put/parameters/0/schema`,
          path: "paths./api/Parameters.put.parameters[0].schema",
          location: `${newFilePath}:24:13`
        },
        type: "Error",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
        mode: "Update"
      },
      {
        code: "DifferentAllOf",
        docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1032.md",
        id: "1032",
        message: "The new version has a different 'allOf' property than the previous one.",
        mode: "Update",
        new: {
          location: `${newFilePath}:36:5`,
          path: "definitions.Database",
          ref: `${newFilePath}#/definitions/Database`
        },
        old: {
          location: `${oldFilePath}:36:5`,
          path: "definitions.Database",
          ref: `${oldFilePath}#/definitions/Database`
        },
        type: "Error"
      }
    ]
    assert.deepStrictEqual(result, expected)
  })
  it("flags 1003 - RequestBodyFormatNoLongerSupported", async () => {
    const diff = new index.OpenApiDiff({})
    const oldFile = "src/test/rule-1003/case1.old.json"
    const newFile = "src/test/rule-1003/case1.new.json"
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
  it("flags 1004 - ResponseBodyFormatNowSupported", async () => {
    const diff = new index.OpenApiDiff({})
    const oldFile = "src/test/rule-1004/case1.old.json"
    const newFile = "src/test/rule-1004/case1.new.json"
    const resultStr = await diff.compare(oldFile, newFile)
    const result = JSON.parse(resultStr)
    const newFilePath = fileUrl(path.resolve(newFile))
    const oldFilePath = fileUrl(path.resolve(oldFile))
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
    assert.deepStrictEqual(result, expected)
  })
})
