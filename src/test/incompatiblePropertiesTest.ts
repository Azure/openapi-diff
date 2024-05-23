import * as assert from "assert"
import * as path from "path"
import { OpenApiDiff } from ".."
import { fileUrl } from "./fileUrl"

// This test is part of regression test suite for https://github.com/Azure/azure-sdk-tools/issues/5981
// Given a property with given type and name
// When another property with the same name but an incompatible type is referenced
// Then an issue is reported, with output providing the exact source file locations of both of the occurrences of the property.
//
// Also ensures that $ref are resolved when determining if types are compatible.
// For example, these should be incompatible:
// 1. "bar": { "type":"string" }
// 2. "bar": { "$ref":"#/definitions/MyObject" }, "MyObject": { "type": "object" }
test.each(["string-object", "string-refobject", "refstring-object", "refstring-refobject"])("incompatible-properties-%s", async prop => {
  const diff = new OpenApiDiff({})
  const file = `src/test/specs/incompatible-properties/${prop}.json`
  const filePath = fileUrl(path.resolve(file))

  try {
    await diff.compare(file, file)
    assert.fail("expected diff.compare() to throw")
  } catch (error) {
    const e = error as Error
    assert.equal(
      e.message,
      `incompatible properties : ${prop}\n` +
        `  definitions/Foo/properties/${prop}\n` +
        `    at ${filePath}#L12:8\n` +
        `  definitions/Foo2/properties/${prop}\n` +
        `    at ${filePath}#L25:8`
    )
  }
})

// test("incompatible-properties-string-refobject", async () => {
//   const diff = new OpenApiDiff({})
//   const file = "src/test/specs/incompatible-properties/string-refobject.json"
//   const filePath = fileUrl(path.resolve(file))

//   try {
//     await diff.compare(file, file)
//     assert.fail("expected diff.compare() to throw")
//   } catch (error) {
//     const e = error as Error
//     assert.equal(
//       e.message,
//       "incompatible properties : string-refobject\n" +
//         "  definitions/Foo/properties/string-refobject\n" +
//         `    at ${filePath}#L12:8\n` +
//         "  definitions/Foo2/properties/string-refobject\n" +
//         `    at ${filePath}#L25:8`
//     )
//   }
// })

// test("incompatible-properties-refstring-object", async () => {
//   const diff = new OpenApiDiff({})
//   const file = "src/test/specs/incompatible-properties/string-refobject.json"
//   const filePath = fileUrl(path.resolve(file))

//   try {
//     await diff.compare(file, file)
//     assert.fail("expected diff.compare() to throw")
//   } catch (error) {
//     const e = error as Error
//     assert.equal(
//       e.message,
//       "incompatible properties : refstring-object\n" +
//         "  definitions/Foo/properties/refstring-object\n" +
//         `    at ${filePath}#L12:8\n` +
//         "  definitions/Foo2/properties/refstring-object\n" +
//         `    at ${filePath}#L25:8`
//     )
//   }
// })

// test("incompatible-properties-refstring-refobject", async () => {
//   const diff = new OpenApiDiff({})
//   const file = "src/test/specs/incompatible-properties/refstring-refobject.json"
//   const filePath = fileUrl(path.resolve(file))

//   try {
//     await diff.compare(file, file)
//     assert.fail("expected diff.compare() to throw")
//   } catch (error) {
//     const e = error as Error
//     assert.equal(
//       e.message,
//       "incompatible properties : refstring-refobject\n" +
//         "  definitions/Foo/properties/refstring-refobject\n" +
//         `    at ${filePath}#L12:8\n` +
//         "  definitions/Foo2/properties/refstring-refobject\n" +
//         `    at ${filePath}#L25:8`
//     )
//   }
// })
