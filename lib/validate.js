// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

'use strict';

var fs = require('fs'),
  log = require('./util/logging'),
  utils = require('./util/utils'),
  Constants = require('./util/constants'),
  path = require('path'),
  util = require('util'),
  OpenApiDiff = require('./validators/openApiDiff');

exports = module.exports;

exports.detectChanges = function detectChanges(oldSpec, newSpec, options) {
  if (!options) options = {};
  log.consoleLogLevel = options.consoleLogLevel || log.consoleLogLevel;
  log.filepath = options.logFilepath || log.filepath;
  let openApiDiff = new OpenApiDiff(options);
  return openApiDiff.detectChanges(oldSpec, newSpec);
};
