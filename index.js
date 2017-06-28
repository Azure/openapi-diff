// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

'use strict';

var validate = require('./lib/validate');
var utils = require('./lib/util/utils');

// Easy to use methods from validate.js
exports.log = require('./lib/util/logging');
exports.compare = validate.compare;

// Classes
exports.OpenApiDiff = require('./lib/validators/OpenApiDiff');

// Constants
exports.Constants = require('./lib/util/constants');
