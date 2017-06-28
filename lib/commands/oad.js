// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

'use strict';
const log = require('../util/logging'),
  validate = require('../validate');

exports.command = 'compare <old-spec> <new-spec>';

exports.describe = 'Compares old and new open api specification for breaking changes.';

exports.builder = {
  j: {
    alias: 'inJson',
    describe: 'A boolean flag indicating whether output format of the messages is json.',
    boolean: true,
    default: true
  },
  s: {
    alias: 'strict',
    describe: 'If true, then checking should be strict, in other words, breaking changes are errors intead of warnings.',
    boolean: true,
    default: false
  }
};

exports.handler = function (argv) {
  log.debug(argv);
  let oldSpec = argv.oldSpec;
  let newSpec = argv.newSpec;
  let vOptions = {};
  vOptions.consoleLogLevel = argv.logLevel;
  vOptions.logFilepath = argv.f;
  vOptions.json = argv.j;
  vOptions.strict = argv.s;

  return validate.compare(oldSpec, newSpec, vOptions);
}

exports = module.exports;
