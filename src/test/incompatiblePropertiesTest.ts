import * as assert from "assert"
import * as path from "path"
import { OpenApiDiff } from ".."
import { fileUrl } from "./fileUrl"

// This test is part of regression test suite for https://github.com/Azure/azure-sdk-tools/issues/5981
// Given a property with given type and name
// When another property with the same name but an incompatible type is referenced
// Then an issue is reported, with output providing the exact source file locations of both of the occurrences of the property.
test("incompatible-properties", async () => {
  const diff = new OpenApiDiff({})
  const file = "src/test/specs/incompatible-properties.json"
  const filePath = fileUrl(path.resolve(file))

  try {
    await diff.compare(file, file)
    assert.fail("expected diff.compare() to throw")
  } catch (error) {
    const e = error as Error
    assert.equal(
      e.message,
      "incompatible properties : bar\n" +
        "  definitions/FooBarString/properties/bar\n" +
        `    at ${filePath}#L13:8\n` +
        "  definitions/FooBarObject/properties/bar\n" +
        `    at ${filePath}#L26:8`
    )
  }
})
