#!/usr/bin/env node

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

'use strict';

var yargs = require('yargs'),
  os = require('os'),
  log = require('./lib/util/logging');

var defaultLogDir = log.directory;
var logFilepath = log.filepath;
var packageVersion = require('./package.json').version;

yargs
  .version(packageVersion)
  .commandDir('lib/commands')
  .option('h', { alias: 'help' })
  .option('l', {
    alias: 'logLevel',
    describe: 'Set the logging level for console.',
    choices: ['off', 'json', 'error', 'warn', 'info', 'verbose', 'debug', 'silly'],
    default: 'warn'
  })
  .option('f', {
    alias: 'logFilepath',
    describe: `Set the log file path. It must be an absolute filepath. ` +
    `By default the logs will stored in a timestamp based log file at "${defaultLogDir}".`
  })
  .option('o', {
    alias: 'oldTagName',
    describe: `The tag name for the old specification file.  If include it ` +
    `indicates that the old spec file is a readme file`
  })
  .option('n', {
    alias: 'newTagName',
    describe: `The tag name for the new specification file.  If include it ` +
    `indicates that the new spec file is a readme file`
  })
  .global(['h', 'l', 'f'])
  .help()
  .argv;

if (yargs.argv._.length === 0 && yargs.argv.h === false) {
  yargs.coerce('help', function (arg) { return true; }).argv;
}
