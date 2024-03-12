import * as assert from "assert";
import * as path from "path";
import * as index from "../index";
import { fileUrl } from "./fileUrl";

test("full reversed", async () => {
  const oldFile = "src/test/full/new/readme.md";
  const newFile = "src/test/full/old/readme.md";
  const diff = new index.OpenApiDiff({});
  const resultStr = await diff.compare(oldFile, newFile, "2019", "2019");
  const result = JSON.parse(resultStr);
  const oldFilePath = fileUrl(path.resolve("src/test/full/new/openapi.json"));
  const oldFilePath2 = fileUrl(path.resolve("src/test/full/new/openapi2.json"));
  const newFilePath = fileUrl(path.resolve("src/test/full/old/openapi.json"));
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
    },
    {
      code: "RemovedPath",
      docUrl: "https://github.com/Azure/openapi-diff/tree/master/docs/rules/1005.md",
      id: "1005",
      message: "The new version is missing a path that was found in the old version. Was path '/x' removed or restructured?",
      mode: "Removal",
      old: {
        location: `${oldFilePath2}:8:5`,
        path: "paths./x",
        ref: `${oldFilePath2}#/paths/~1x`
      },
      new: {},
      type: "Error"
    }
  ];
  assert.deepStrictEqual(result, expected);
});
