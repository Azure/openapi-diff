// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { log } from "./util/logging"
import { Options, OpenApiDiff } from "./validators/openApiDiff"

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
 */
export function compare(oldSwagger: string, newSwagger: string, options: Options) {
  if (!options) {
    options = {}
  }

  log.consoleLogLevel = options.consoleLogLevel || log.consoleLogLevel
  log.filepath = options.logFilepath || log.filepath
  const openApiDiff = new OpenApiDiff(options)

  return openApiDiff.compare(oldSwagger, newSwagger)
}

/**
 * Wrapper method to compares old and new specifications.
 *
 * @param {string} oldSwagger Path to the old specification file.
 *
 * @param {string} oldTag Tag name used for autorest with the old specification file.
 *
 * @param {string} newSwagger Path to the new specification file.
 *
 * @param {string} newTagName Tag name used for autorest with the new specification file.
 *
 * @param {object} options The configuration options.
 *
 * @param {boolean} [options.json] A boolean flag indicating whether output format of the messages is json.
 *
 * @param {boolean} [options.matchApiVersion] A boolean flag indicating whether to consider api-version while comparing.
 *
 */
export function compareTags(oldSwagger: string, oldTag: string, newSwagger: string, newTag: string, options: Options) {
  if (!options) {
    options = {}
  }

  log.consoleLogLevel = options.consoleLogLevel || log.consoleLogLevel
  log.filepath = options.logFilepath || log.filepath
  const openApiDiff = new OpenApiDiff(options)

  return openApiDiff.compare(oldSwagger, newSwagger, oldTag, newTag)
}
