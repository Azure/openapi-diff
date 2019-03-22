import * as index from "../index"

jest.setTimeout(10000);

describe("index", () => {
  it("simple", async () => {
    const diff = new index.OpenApiDiff({})
    const result = await diff.compare("src/test/simple/same.json", "src/test/simple/same.json")
  })
})