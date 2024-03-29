import * as assert from "assert"
import * as path from "path"
import * as index from "../index"
import { fileUrl } from "./fileUrl"

test("incompatible-properties", async () => {
  const diff = new index.OpenApiDiff({})
  const file = "src/test/incompatible-properties/incompatible-properties.json"

  try {
    await diff.compare(file, file)
    assert.fail("expected diff.compare() to throw")
  }
  catch (error) {
    const e = error as Error;
    assert.equal(e.message, "incompatible properties : bar ")
  }
})
