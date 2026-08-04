import * as assert from "assert"
import * as fs from "fs"
import * as os from "os"
import * as path from "path"
import { getAutoRestRegistry } from "../lib/validators/openApiDiff"

describe("OpenApiDiff", () => {
  it("gets the AutoRest core registry from the npm user config", () => {
    const tempFolder = fs.mkdtempSync(path.join(os.tmpdir(), "oad-npmrc-"))
    const npmrcPath = path.join(tempFolder, ".npmrc")
    fs.writeFileSync(npmrcPath, "@azure:registry=https://example.invalid/scoped/\nregistry=https://packagefeedproxy.microsoft.io/npm/\n")

    const environmentVariables = ["autorest_registry", "npm_config_registry", "NPM_CONFIG_REGISTRY"] as const
    const originalValues = environmentVariables.map(name => process.env[name])
    environmentVariables.forEach(name => delete process.env[name])

    try {
      assert.equal(getAutoRestRegistry(npmrcPath), "https://packagefeedproxy.microsoft.io/npm/")
    } finally {
      environmentVariables.forEach((name, index) => {
        const originalValue = originalValues[index]
        if (originalValue === undefined) {
          delete process.env[name]
        } else {
          process.env[name] = originalValue
        }
      })
      fs.rmSync(tempFolder, { recursive: true, force: true })
    }
  })
})
