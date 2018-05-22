// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

"use strict";
const log = require("../util/logging"),
  validate = require("../validate");

exports.command = "compare <old-spec> <new-spec>";

exports.describe =
  "Compares old and new open api specification for breaking changes.";

exports.builder = {
  j: {
    alias: "inJson",
    describe:
      "A boolean flag indicating whether output format of the messages is json.",
    boolean: true,
    default: true
  },
  o: {
    alias: "oldTagName",
    describe:
      "The tag name for the old specification file.  If included it indicates that the old spec file is a readme file"
  },
  n: {
    alias: "newTagName",
    describe:
      "The tag name for the new specification file.  If included it indicates that the new spec file is a readme file"
  }
};

exports.handler = function(argv) {
  log.debug(argv);
  let oldSpec = argv.oldSpec;
  let oldTag = argv.o;
  let newSpec = argv.newSpec;
  let newTag = argv.n;
  let vOptions = {};
  vOptions.consoleLogLevel = argv.logLevel;
  vOptions.logFilepath = argv.f;
  vOptions.json = argv.j;

  let compareFunc;
  if (oldTag && newTag) {
    compareFunc = validate.compareTags(
      oldSpec,
      oldTag,
      newSpec,
      newTag,
      vOptions
    );
  } else {
    compareFunc = validate.compare(oldSpec, newSpec, vOptions);
  }

  return compareFunc
    .then(result => {
      console.log(result);
    })
    .catch(err => {
      console.log(err);
      process.exitCode = 1;
    });
};

exports = module.exports;
