// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { log } from "../util/logging"
import { compareTags, compare } from "../validate"

export const command = "compare <old-spec> <new-spec>"

export const describe = "Compares old and new open api specification for breaking changes."

export const builder = {
  j: {
    alias: "inJson",
    describe: "A boolean flag indicating whether output format of the messages is json.",
    boolean: true,
    default: true
  },
  o: {
    alias: "oldTagName",
    describe: "The tag name for the old specification file.  If included it indicates that the old spec file is a readme file"
  },
  n: {
    alias: "newTagName",
    describe: "The tag name for the new specification file.  If included it indicates that the new spec file is a readme file"
  }
}

export type Argv = {
  readonly oldSpec: string
  readonly o?: string
  readonly newSpec: string
  readonly n?: string
  readonly logLevel?: unknown
  readonly f?: unknown
  readonly j?: unknown
}

export const handler = (argv: Argv) => {
  log.debug(argv)
  const oldSpec = argv.oldSpec
  const oldTag = argv.o
  const newSpec = argv.newSpec
  const newTag = argv.n
  const vOptions = {
    consoleLogLevel: argv.logLevel,
    logFilepath: argv.f,
    json: argv.j
  }

  const compareFunc = oldTag && newTag ? compareTags(oldSpec, oldTag, newSpec, newTag, vOptions) : compare(oldSpec, newSpec, vOptions)

  return compareFunc
    .then(result => {
      console.log(result)
    })
    .catch(err => {
      console.log(err)
      process.exitCode = 1
    })
}
