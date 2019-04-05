// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as validate from './lib/validate'

// Easy to use methods from validate.js
export { log as log } from './lib/util/logging'
export const compare = validate.compare
export const compareTags = validate.compareTags

// Classes
export { OpenApiDiff, Messages } from './lib/validators/openApiDiff'

// Constants
export const Constants = require('./lib/util/constants')

