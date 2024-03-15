import * as assert from "assert"
import * as index from "../index"

test("'Missing required property: name' at x-ms-enum", async () => {
  const diff = new index.OpenApiDiff({})
  const resultStr = await diff.compare(
    "src/test/required-property-name-x-ms-enum/source/openapi.json",
    "src/test/required-property-name-x-ms-enum/target/openapi.json",
  )
  const result: index.Messages = JSON.parse(resultStr)
})
