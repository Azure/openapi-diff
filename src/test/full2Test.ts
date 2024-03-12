import * as assert from "assert";
import * as index from "../index";

test("full2", async () => {
  const source = {
    url: "src/test/full2/source/readme.md",
    tag: "package-compute-only-2017-12"
  };

  const target = {
    url: "src/test/full2/target/readme.md",
    tag: "package-compute-2018-04"
  };

  const diff = new index.OpenApiDiff({});
  const resultStr = await diff.compare(source.url, target.url, source.tag, target.tag);
  const result: index.Messages = JSON.parse(resultStr);
  for (const v of result) {
    assert.deepStrictEqual(v.old.location !== undefined || v.new.location !== undefined, true);
  }
});
