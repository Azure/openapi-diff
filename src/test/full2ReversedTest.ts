import * as assert from "assert"
import { Messages, OpenApiDiff } from ".."

test("full2 reversed", async () => {
  const source = {
    url: "src/test/specs/full2/target/readme.md",
    tag: "package-compute-2018-04"
  }

  const target = {
    url: "src/test/specs/full2/source/readme.md",
    tag: "package-compute-only-2017-12"
  }

  const diff = new OpenApiDiff({})
  const resultStr = await diff.compare(source.url, target.url, source.tag, target.tag)
  const result: Messages = JSON.parse(resultStr)
  for (const v of result) {
    assert.deepStrictEqual(v.old.location !== undefined || v.new.location !== undefined, true)
  }
})
