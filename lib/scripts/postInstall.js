// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

'use strict';

const execSync = require('child_process').execSync,
      util = require('util');

/**
 * @class
 * Open API Diff class.
 */
class PostInstall {

  constructor() {
  }

  installAutoRest() {
    try {
      // let cmd = `npm install -g autorest`;
      // let result = execSync(cmd, { encoding: 'utf8' });
      let cmd = `autorest --version=latest`;
      let result = execSync(cmd, { encoding: 'utf8' });
      console.log(result);
      // result = execSync(`which autorest`, { encoding: 'utf8' });
      // console.log(result);
    } catch (err) {
      throw new Error(`An error occurred while installing AutoRest: ${util.inspect(err, { depth: null })}.`);
    }
  }
}

let postInstall = new PostInstall();
postInstall.installAutoRest();

module.exports = PostInstall;
