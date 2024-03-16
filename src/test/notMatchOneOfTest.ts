import * as assert from "assert"
import * as index from "../index"

test("not match 'oneOf'", async () => {
  const diff = new index.OpenApiDiff({})
  const resultStr = await diff.compare(
    "src/test/not-match-oneof/source/schemaregistry.json",
    "src/test/not-match-oneof/target/schemaregistry.json"
  )
  const result: index.Messages = JSON.parse(resultStr)
  for (const v of result) {
    assert.deepStrictEqual(v.old.location !== undefined || v.new.location !== undefined, true)
  }
})
