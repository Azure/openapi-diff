// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as winston from 'winston'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
var gDir = path.resolve(os.homedir(), 'oad_output')

var currentLogFile: unknown
var logDir: unknown

/*
 * Provides current time in custom format that will be used in naming log files. Example:'20140820_151113'
 * @return {string} Current time in a custom string format
 */
function getTimeStamp() {
  // We pad each value so that sorted directory listings show the files in chronological order
  function pad(number: any) {
    if (number < 10) {
      return '0' + number;
    }

    return number;
  }

  var now = new Date();
  return pad(now.getFullYear())
    + pad(now.getMonth() + 1)
    + pad(now.getDate())
    + "_"
    + pad(now.getHours())
    + pad(now.getMinutes())
    + pad(now.getSeconds());
}
var customLogLevels = {
  off: 0,
  json: 1,
  error: 2,
  warn: 3,
  info: 4,
  verbose: 5,
  debug: 6,
  silly: 7
};

export var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: 'warn',
      colorize: true,
      prettyPrint: true,
      humanReadableUnhandledException: true
    })
  ],
  levels: customLogLevels
});

Object.defineProperties(logger, {
  'consoleLogLevel': {
    enumerable: true,
    get: function () { return this.transports.console.level; },
    set: function (level) {
      if (!level) {
        level = 'warn';
      }
      let validLevels = Object.keys(customLogLevels);
      if (!validLevels.some(function (item) { return item === level; })) {
        throw new Error(`The logging level provided is "${level}". Valid values are: "${validLevels}".`);
      }
      this.transports.console.level = level;
      return;
    }
  },
  'directory': {
    enumerable: true,
    get: function () {
      return logDir;
    },
    set: function (logDirectory) {
      if (!logDirectory || logDirectory && typeof logDirectory.valueOf() !== 'string') {
        throw new Error('logDirectory cannot be null or undefined and must be of type "string".');
      }

      if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory);
      }
      logDir = logDirectory;
      return;
    }
  },
  'filepath': {
    enumerable: true,
    get: function () {
      if (!currentLogFile) {
        let filename = `validate_log_${getTimeStamp()}.log`;
        currentLogFile = path.join(this.directory, filename);
      }

      return currentLogFile;
    },
    set: function (logFilePath) {
      if (!logFilePath || logFilePath && typeof logFilePath.valueOf() !== 'string') {
        throw new Error('filepath cannot be null or undefined and must be of type string. It must be an absolute file path.')
      }
      currentLogFile = logFilePath;
      this.directory = path.dirname(logFilePath);
      if (!this.transports.file) {
        this.add(winston.transports.File, {
          level: 'silly',
          colorize: false,
          silent: false,
          prettyPrint: true,
          json: false,
          filename: logFilePath
        });
      }
      return;
    }
  }
});
