import * as assert from "assert"
import * as index from "../index"

test("incompatible-properties", async () => {
  const diff = new index.OpenApiDiff({})
  const file = "src/test/specs/incompatible-properties.json"

  try {
    await diff.compare(file, file)
    assert.fail("expected diff.compare() to throw")
  }
  catch (error) {
    const e = error as Error;
    assert.equal(e.message, "incompatible properties : bar ")
  }
})
