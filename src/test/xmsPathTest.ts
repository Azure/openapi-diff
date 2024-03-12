import * as assert from "assert";
import * as path from "path";
import * as index from "../index";
import { fileUrl } from "./fileUrl";

test("xms-path", async () => {
  const diff = new index.OpenApiDiff({});
  const oldFile = "src/test/xmspath/old.json";
  const newFile = "src/test/xmspath/new.json";
  const resultStr = await diff.compare(oldFile, newFile);
  const result = JSON.parse(resultStr);
  const newFilePath = fileUrl(path.resolve(newFile));
  const oldFilePath = fileUrl(path.resolve(oldFile));
  const expected = [
    {
      code: "NoVersionChange",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1001.md",
      id: "1001",
      message: "The versions have not changed.",
      mode: "Update",
      new: {
        ref: `${newFilePath}#`,
        location: `${newFilePath}:1:1`,
        path: ""
      },
      old: {
        ref: `${oldFilePath}#`,
        location: `${oldFilePath}:1:1`,
        path: ""
      },
      type: "Info"
    }
  ];
  assert.deepStrictEqual(result, expected);
});
