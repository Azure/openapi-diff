// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

'use strict';

const util = require('util'),
  path = require('path'),
  os = require('os'),
  url = require('url'),
  _ = require('lodash'),
  glob = require('glob'),
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

  constructor() {
    log.silly(`Initializaing OpenApiDiff`);
  }

  /**
   * Initializes the Open API Diff class.
   */
  initialize() {
  }

  detectChanges(oldSwagger, newSwagger, options) {
    let self = this;
    log.debug(`Hello World`);

    self.processViaAutoRest(oldSwagger, 'old').then((oldSwaggerResult, error) => {
      if (error) {
      }
      self.processViaAutoRest(newSwagger, 'new').then((newSwaggerResult, error) => {
        if (error) {
        }

        self.processViaOpenApiDiff(oldSwaggerResult, newSwaggerResult).then((result, error) => {
          if (error) {

          }
          console.log(result);
          return;
        });
      });
    });
  }

  dotNetPath() {
    // try global installation directory
    let result = path.join(os.homedir(), ".autorest", "frameworks", "dotnet");
    if (fs.existsSync(result)) {
      return result;
    }

    result = path.join(os.homedir(), ".autorest", "frameworks", "dotnet.exe");
    if (fs.existsSync(result)) {
      return result;
    }

    // hope there is one in the PATH
    return "dotnet";
  }

  openApiDiffDll() {
    // try global installation directory
    let result = path.join(__dirname, "..", "..", "openapi-diff", "src", "core", "OpenApiDiff", "bin", "Debug", "netcoreapp1.0", "OpenApiDiff.dll");
    // let result = '../Users/vishrut/git-repos/openapi-diff/openapi-diff/src/core/OpenApiDiff/bin/Debug/netcoreapp1.0/OpenApiDiff.dll';

    return result;
  }

  processViaAutoRest(swaggerPath, outputFileName) {
    if (swaggerPath === null || swaggerPath === undefined || typeof swaggerPath.valueOf() !== 'string' || !swaggerPath.trim().length) {
        throw new Error('swaggerPath is a required parameter of type "string" and it cannot be an empty string.');
    }

    if (outputFileName === null || outputFileName === undefined || typeof outputFileName.valueOf() !== 'string' || !outputFileName.trim().length) {
        throw new Error('outputFile is a required parameter of type "string" and it cannot be an empty string.');
    }

    log.debug(`swaggerPath = "${swaggerPath}"`);
    log.debug(`outputFileName = "${outputFileName}"`);

    let autoRestPromise = new Promise((resolve, reject) => {
      if (!fs.existsSync(swaggerPath)) {
        reject(`File "${swaggerPath}" not found.`);
      }

      let outputFolder = os.tmpdir();
      let outputFilePath = path.join(outputFolder, `${outputFileName}.json`);
      let autoRestCmd = `autorest --input-file=${swaggerPath} --output-artifact=swagger-document.json --output-file=${outputFileName} --output-folder=${outputFolder}`;

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

  processViaOpenApiDiff(oldSwagger, newSwagger) {
    let self = this;

    if (oldSwagger === null || oldSwagger === undefined || typeof oldSwagger.valueOf() !== 'string' || !oldSwagger.trim().length) {
        throw new Error('oldSwagger is a required parameter of type "string" and it cannot be an empty string.');
    }

    if (newSwagger === null || newSwagger === undefined || typeof newSwagger.valueOf() !== 'string' || !newSwagger.trim().length) {
        throw new Error('newSwagger is a required parameter of type "string" and it cannot be an empty string.');
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

      let cmd = `${self.dotNetPath()} ${self.openApiDiffDll()} -o ${oldSwagger} -n ${newSwagger} -JsonValidationMessages`;

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
