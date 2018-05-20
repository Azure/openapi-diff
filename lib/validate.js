// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

'use strict';

var log = require('./util/logging'),
    OpenApiDiff = require('./validators/openApiDiff');

exports = module.exports;

/**
 * Wrapper method to compares old and new specifications.
 *
 * @param {string} oldSwagger Path to the old specification file.
 *
 * @param {string} newSwagger Path to the new specification file.
 *
 * @param {object} options The configuration options.
 *
 * @param {boolean} [options.json] A boolean flag indicating whether output format of the messages is json.
 * 
 * @param {boolean} [options.matchApiVersion] A boolean flag indicating whether to consider api-version while comparing.
 * 
 * @param {string} [options.oldTagName] Tag name used for autorest with the old specification file.
 *
 * @param {string} [options.newTagName] Tag name used for autorest with the new specification file.
 * 
 */
exports.compare = function compare(oldSwagger, newSwagger, options) {
  if (!options) options = {};

  log.consoleLogLevel = options.consoleLogLevel || log.consoleLogLevel;
  log.filepath = options.logFilepath || log.filepath;
  let openApiDiff = new OpenApiDiff(options);

  return openApiDiff.compare(oldSwagger, newSwagger);
};
