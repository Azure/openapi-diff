import * as index from "../index"
import * as assert from "assert"

jest.setTimeout(10000);

describe("index", () => {
  it("simple", async () => {
    const diff = new index.OpenApiDiff({})
    const result = await diff.compare("src/test/simple/same.json", "src/test/simple/same.json")
  })
})