// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as fs from "fs"
import * as path from "path"
import * as winston from "winston"

let currentLogFile: unknown
let logDir: unknown

/*
 * Provides current time in custom format that will be used in naming log files. Example:'20140820_151113'
 * @return {string} Current time in a custom string format
 */
function getTimeStamp() {
  // We pad each value so that sorted directory listings show the files in chronological order
  function pad(number: number) {
    if (number < 10) {
      return "0" + number
    }

    return number.toString()
  }

  const now = new Date()
  return (
    pad(now.getFullYear()) +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    "_" +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  )
}
const customLogLevels = {
  off: 0,
  json: 1,
  error: 2,
  warn: 3,
  info: 4,
  verbose: 5,
  debug: 6,
  silly: 7
}

export type Logger = {
  consoleLogLevel: unknown
  filepath: unknown
  directory: unknown
  readonly silly: (v: string) => void
  readonly debug: (v: unknown) => void
  readonly error: (v: unknown) => void
}

const transports = {
  console: new winston.transports.Console({
    level: "warn",
    format: winston.format.combine(winston.format.simple())
  })
}

export let log: Logger = winston.createLogger({
  transports: [transports.console],
  levels: customLogLevels
}) as any

Object.defineProperties(log, {
  consoleLogLevel: {
    enumerable: true,
    get() {
      return this.transports.console.level
    },
    set(level) {
      if (!level) {
        level = "warn"
      }
      const validLevels = Object.keys(customLogLevels)
      if (
        !validLevels.some(function (item) {
          return item === level
        })
      ) {
        throw new Error(`The logging level provided is "${level}". Valid values are: "${validLevels}".`)
      }
      transports.console.level = level
      return
    }
  },
  directory: {
    enumerable: true,
    get() {
      return logDir
    },
    set(logDirectory) {
      if (!logDirectory || (logDirectory && typeof logDirectory.valueOf() !== "string")) {
        throw new Error('logDirectory cannot be null or undefined and must be of type "string".')
      }

      if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory)
      }
      logDir = logDirectory
      return
    }
  },
  filepath: {
    enumerable: true,
    get() {
      if (!currentLogFile) {
        const filename = `validate_log_${getTimeStamp()}.log`
        currentLogFile = this.directory ? path.join(this.directory, filename) : filename
      }

      return currentLogFile
    },
    set(logFilePath) {
      if (!logFilePath || (logFilePath && typeof logFilePath.valueOf() !== "string")) {
        throw new Error("filepath cannot be null or undefined and must be of type string. It must be an absolute file path.")
      }
      currentLogFile = logFilePath
      this.directory = path.dirname(logFilePath)
      if (!this.transports.file) {
        this.add(
          new winston.transports.File({
            level: "silly",
            silent: false,
            filename: logFilePath
          })
        )
      }
      return
    }
  }
})
