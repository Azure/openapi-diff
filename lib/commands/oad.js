// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

'use strict';
const log = require('../util/logging'),
  validate = require('../validate');

exports.command = 'oad <old-spec> <new-spec>';

exports.describe = 'Detects breaking changes between old and new open api specification.';

exports.handler = function (argv) {
  log.debug(argv);
  let oldSpec = argv.oldSpec;
  let newSpec = argv.newSpec;
  let vOptions = {};
  vOptions.consoleLogLevel = argv.logLevel;
  vOptions.logFilepath = argv.f;

  return validate.detectChanges(oldSpec, newSpec, vOptions);
}

exports = module.exports;
