import * as assert from "assert"
import * as path from "path"
import * as index from "../index"
import { fileUrl } from "./fileUrl"

test("incompatible-properties", async () => {
  const diff = new index.OpenApiDiff({})
  const file = "src/test/specs/incompatible-properties.json"
  const filePath = fileUrl(path.resolve(file))

  try {
    await diff.compare(file, file)
    assert.fail("expected diff.compare() to throw")
  }
  catch (error) {
    const e = error as Error;
    assert.equal(e.message, "incompatible properties : bar\n" +
      "  definitions/FooBarString/properties/bar\n" +
      `    at ${filePath}#L13:8\n` +
      "  definitions/FooBarObject/properties/bar\n" +
      `    at ${filePath}#L26:8`
    )
  }
})
