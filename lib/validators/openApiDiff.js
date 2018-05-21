// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

'use strict';

const util = require('util'),
  path = require('path'),
  os = require('os'),
  url = require('url'),
  log = require('../util/logging'),
  utils = require('../util/utils'),
  fs = require('fs'),
  execSync = require('child_process').execSync,
  exec = require('child_process').exec;

/**
 * @class
 * Open API Diff class.
 */
class OpenApiDiff {
  /**
   * Constructs OpenApiDiff based on provided options.
   *
   * @param {object} options The configuration options.
   *
   * @param {boolean} [options.json] A boolean flag indicating whether output format of the messages is json.
   *
   * @param {boolean} [options.matchApiVersion] A boolean flag indicating whether to consider api-version while comparing.
   *
   * @returns {object} OpenApiDiff Returns the configured OpenApiDiff object.
   */
  constructor(options) {
    log.silly(`Initializaing OpenApiDiff class`);
    this.options = options;

    if (this.options === null || this.options === undefined) {
      this.options = {};
      this.options.json = true;
    }
    if (typeof this.options !== 'object') {
      throw new Error('options must be of type "object".');
    }

    log.debug(`Initialized OpenApiDiff class with options = ${util.inspect(this.options, { depth: null })}`);
  }

  /**
   * Compares old and new specifications.
   *
   * @param {string} oldSwagger Path to the old specification file.
   *
   * @param {string} newSwagger Path to the new specification file.
   *
   * @param {string} oldTag Tag name used for autorest with the old specification file.
   *
   * @param {string} newTag Tag name used for autorest with the new specification file.
   *
   */
  compare(oldSwagger, newSwagger, oldTag, newTag) {
    log.silly(`compare is being called`);

    let self = this;
    var promise1 = self.processViaAutoRest(oldSwagger, 'old', oldTag);
    var promise2 = self.processViaAutoRest(newSwagger, 'new', newTag);

    return Promise.all([promise1, promise2]).then(results => {
      return self.processViaOpenApiDiff(results[0], results[1]);
    });
  }

  /**
   * Gets path to the dotnet executable.
   *
   * @returns {string} Path to the dotnet executable.
   */
  dotNetPath() {
    log.silly(`dotNetPath is being called`);

    // Assume that dotnet is in the PATH
    return "dotnet";
  }

  /**
   * Gets path to the autorest application.
   *
   * @returns {string} Path to the autorest app.js file.
   */
  autoRestPath() {
    log.silly(`autoRestPath is being called`);

    // When oad is installed globally
    let result = path.join(__dirname, "..", "..", "node_modules", "autorest", "app.js");
    if (fs.existsSync(result)) {
      return `node ${result}`;
    }

    // When oad is installed locally
    result = path.join(__dirname, "..", "..", "..", "autorest", "app.js");
    if (fs.existsSync(result)) {
      return `node ${result}`;
    }

    // Assume that autorest is in the path
    return 'autorest';
  }

  /**
   * Gets path to the OpenApiDiff.dll.
   *
   * @returns {string} Path to the OpenApiDiff.dll.
   */
  openApiDiffDllPath() {
    log.silly(`openApiDiffDllPath is being called`);

    return path.join(__dirname, "..", "dlls", "OpenApiDiff.dll");
  }

  /**
   * Processes the provided speicifcation via autorest.
   *
   * @param {string} swaggerPath Path to the specification file.
   *
   * @param {string} outputFileName Name of the output file to which autorest outputs swagger-doc.
   *
   * @param {string} tagName Name of the tag in the specification file.
   *
   */
  processViaAutoRest(swaggerPath, outputFileName, tagName) {
    log.silly(`processViaAutoRest is being called`);

    let self = this;
    if (swaggerPath === null || swaggerPath === undefined || typeof swaggerPath.valueOf() !== 'string' || !swaggerPath.trim().length) {
        return Promise.reject(new Error('swaggerPath is a required parameter of type "string" and it cannot be an empty string.'));
    }

    if (outputFileName === null || outputFileName === undefined || typeof outputFileName.valueOf() !== 'string' || !outputFileName.trim().length) {
        return Promise.reject(new Error('outputFile is a required parameter of type "string" and it cannot be an empty string.'));
    }

    log.debug(`swaggerPath = "${swaggerPath}"`);
    log.debug(`outputFileName = "${outputFileName}"`);

    let autoRestPromise = new Promise((resolve, reject) => {
      if (!fs.existsSync(swaggerPath)) {
        reject(`File "${swaggerPath}" not found.`);
      }

      let outputFolder = os.tmpdir();
      let outputFilePath = path.join(outputFolder, `${outputFileName}.json`);
      var autoRestCmd = tagName 
        ? `${self.autoRestPath()} ${swaggerPath} --tag=${tagName} --output-artifact=swagger-document.json --output-file=${outputFileName} --output-folder=${outputFolder}`
        : `${self.autoRestPath()} --input-file=${swaggerPath} --output-artifact=swagger-document.json --output-file=${outputFileName} --output-folder=${outputFolder}`;

      log.debug(`Executing: "${autoRestCmd}"`);

      exec(autoRestCmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 }, (err, stdout, stderr) => {
        if (stderr) {
          reject(stderr);
        }

        log.debug(`outputFilePath: "${outputFilePath}"`);
        resolve(outputFilePath);
      });
    });

    return autoRestPromise;
  }

  /**
   * Processes the provided speicifcations via OpenApiDiff tool.
   *
   * @param {string} oldSwagger Path to the old specification file.
   *
   * @param {string} newSwagger Path to the new specification file.
   *
   */
  processViaOpenApiDiff(oldSwagger, newSwagger) {
    log.silly(`processViaOpenApiDiff is being called`);

    let self = this;

    if (oldSwagger === null || oldSwagger === undefined || typeof oldSwagger.valueOf() !== 'string' || !oldSwagger.trim().length) {
        return Promise.reject(new Error('oldSwagger is a required parameter of type "string" and it cannot be an empty string.'));
    }

    if (newSwagger === null || newSwagger === undefined || typeof newSwagger.valueOf() !== 'string' || !newSwagger.trim().length) {
        return Promise.reject(new Error('newSwagger is a required parameter of type "string" and it cannot be an empty string.'));
    }

    log.debug(`oldSwagger = "${oldSwagger}"`);
    log.debug(`newSwagger = "${newSwagger}"`);

    let OpenApiDiffPromise = new Promise((resolve, reject) => {
      if (!fs.existsSync(oldSwagger)) {
        reject(`File "${oldSwagger}" not found.`);
      }

      if (!fs.existsSync(newSwagger)) {
        reject(`File "${newSwagger}" not found.`);
      }

      let cmd = `${self.dotNetPath()} ${self.openApiDiffDllPath()} -o ${oldSwagger} -n ${newSwagger}`;
      if (self.options.json)
      {
        cmd = `${cmd} -JsonValidationMessages`;
      }

      log.debug(`Executing: "${cmd}"`);
      exec(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 }, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        }

        resolve(stdout);
      });
    });

    return OpenApiDiffPromise;
  }
}

// Export OpenApiDiff
module.exports = OpenApiDiff;

// Testing
// let swagger = '/Users/vishrut/git-repos/azure-rest-api-specs/arm-network/2017-03-01/swagger/virtualNetworkGateway.json';
// let obj = new OpenApiDiff();
// // obj.processViaAutoRest(swagger, 'new').then((success, error) => {
// //   console.log(success);
// //   console.log(error);
// // });
// console.log(obj.dotNetPath());

// let newSwagger = '/Users/vishrut/git-repos/autorest/generated/NewVirtualNetworkGateway.json';
// let oldSwagger = '/Users/vishrut/git-repos/autorest/generated/VirtualNetworkGateway.json';
// // obj.processViaOpenApiDiff(oldSwagger, newSwagger).then((success, error) => {
// //   console.log(success);
// //   console.log(error);
// // });

// obj.detectChanges(oldSwagger, newSwagger, {});
