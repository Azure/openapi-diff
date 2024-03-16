import * as assert from "assert"
import * as index from "../index"

test("x-ms-enum.name", async () => {
  const diff = new index.OpenApiDiff({})
  const resultStr = await diff.compare(
    "src/test/x-ms-enum-name/source/openapi.json",
    "src/test/x-ms-enum-name/target/openapi.json"
  )
  const result: index.Messages = JSON.parse(resultStr)
  for (const v of result) {
    assert.deepStrictEqual(v.old.location !== undefined || v.new.location !== undefined, true)
  }
})
