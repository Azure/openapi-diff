// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

'use strict';
var fs = require('fs'),
  execSync = require('child_process').execSync,
  util = require('util'),
  path = require('path'),
  jsonPointer = require('json-pointer'),
  YAML = require('js-yaml'),
  log = require('./logging'),
  request = require('request');

/*
 * Caches the json docs that were successfully parsed by parseJson(). This avoids, fetching them again.
 * key: docPath
 * value: parsed doc in JSON format
 */
export let docCache: { [key: string]: unknown } = {};


export function clearCache() {
  docCache = {};
  return;
}
/*
 * Removes byte order marker. This catches EF BB BF (the UTF-8 BOM)
 * because the buffer-to-string conversion in `fs.readFile()`
 * translates it to FEFF, the UTF-16 BOM.
 */
export function stripBOM(content: string) {
  if (Buffer.isBuffer(content)) {
    content = content.toString();
  }
  if (content.charCodeAt(0) === 0xFEFF || content.charCodeAt(0) === 0xFFFE) {
    content = content.slice(1);
  }
  return content;
};

/*
 * Provides a parsed JSON from the given file path or a url.
 *
 * @param {string} specPath - A local file path or a (github) url to the swagger spec.
 * The method will auto convert a github url to rawgithub url.
 *
 * @returns {object} jsonDoc - Parsed document in JSON format.
 */
export function parseJson(specPath: string) {
  let result = null;
  if (!specPath || (specPath && typeof specPath.valueOf() !== 'string')) {
    let err = new Error('A (github) url or a local file path to the swagger spec is required and must be of type string.');
    return Promise.reject(err);
  }
  if (docCache[specPath]) {
    return Promise.resolve(docCache[specPath]);
  }
  //url
  if (specPath.match(/^http.*/ig) !== null) {
    //If the spec path is a url starting with https://github then let us auto convert it to an https://raw.githubusercontent url.
    if (specPath.startsWith('https://github')) {
      specPath = specPath.replace(/^https:\/\/(github.com)(.*)blob\/(.*)/ig, 'https://raw.githubusercontent.com$2$3');
    }
    let res = makeRequest({ url: specPath, errorOnNon200Response: true });
    docCache[specPath] = res;
    return res;
  } else {
    //local filepath
    try {
      let fileContent = stripBOM(fs.readFileSync(specPath, 'utf8'));
      let result = parseContent(specPath, fileContent);
      docCache[specPath] = result;
      return Promise.resolve(result);
    } catch (err) {
      log.error(err);
      return Promise.reject(err);
    }
  }
};

/*
 * Provides a parsed JSON from the given content.
 *
 * @param {string} filePath - A local file path or a (github) url to the swagger spec.
 *
 * @param {string} fileContent - The content to be parsed.
 *
 * @returns {object} jsonDoc - Parsed document in JSON format.
 */
export function parseContent(filePath: string, fileContent: string) {
  let result = null;
  if (/.*\.json$/ig.test(filePath)) {
    result = JSON.parse(fileContent);
  } else if (/.*\.ya?ml$/ig.test(filePath)) {
    result = YAML.safeLoad(fileContent);
  } else {
    let msg = `We currently support "*.json" and "*.yaml | *.yml" file formats for validating swaggers.\n` +
      `The current file extension in "${filePath}" is not supported.`;
    throw new Error(msg);
  }
  return result;
};

/*
 * A utility function to help us acheive stuff in the same way as async/await but with yield statement and generator functions.
 * It waits till the task is over.
 * @param {function} A generator function as an input
 */
export function run(genfun: () => any) {
  // instantiate the generator object
  var gen = genfun();
  // This is the async loop pattern
  function next(err?: unknown, answer?: unknown) {
    var res;
    if (err) {
      // if err, throw it into the wormhole
      return gen.throw(err);
    } else {
      // if good value, send it
      res = gen.next(answer);
    }
    if (!res.done) {
      // if we are not at the end
      // we have an async request to
      // fulfill, we do this by calling
      // `value` as a function
      // and passing it a callback
      // that receives err, answer
      // for which we'll just use `next()`
      res.value(next);
    }
  }
  // Kick off the async loop
  next();
};

export type Options = {
  readonly errorOnNon200Response?: unknown
  readonly url: string
}

export type Response = {
  readonly statusCode?: unknown
}

/*
 * Makes a generic request. It is a wrapper on top of request.js library that provides a promise instead of a callback.
 *
 * @param {object} options - The request options as described over here https://github.com/request/request#requestoptions-callback
 *
 * @param {boolean} options.errorOnNon200Response If true will reject the promise with an error if the response statuscode is not 200.
 *
 * @return {Promise} promise - A promise that resolves to the responseBody or rejects to an error.
 */
export function makeRequest(options: Options) {
  var promise = new Promise(function (resolve, reject) {
    request(options, function (err: unknown, response: Response, responseBody: string) {
      if (err) {
        reject(err);
      }
      if (options.errorOnNon200Response && response.statusCode !== 200) {
        var msg = `StatusCode: "${response.statusCode}", ResponseBody: "${responseBody}."`;
        reject(new Error(msg));
      }
      let res = responseBody;
      try {
        if (typeof responseBody.valueOf() === 'string') {
          res = parseContent(options.url, responseBody);
        }
      } catch (error) {
        let msg = `An error occurred while parsing the file ${options.url}. The error is:\n ${util.inspect(error, { depth: null })}.`
        let e = new Error(msg);
        reject(e);
      }

      resolve(res);
    });
  });
  return promise;
};

/*
 * Executes an array of promises sequentially. Inspiration of this method is here:
 * https://pouchdb.com/2015/05/18/we-have-a-problem-with-promises.html. An awesome blog on promises!
 *
 * @param {Array} promiseFactories An array of promise factories(A function that return a promise)
 *
 * @return A chain of resolved or rejected promises
 */
export function executePromisesSequentially(promiseFactories: ReadonlyArray<any>) {
  let result = Promise.resolve();
  promiseFactories.forEach(function (promiseFactory) {
    result = result.then(promiseFactory);
  });
  return result;
};

/*
 * Generates a randomId
 *
 * @param {string} [prefix] A prefix to which the random numbers will be appended.
 *
 * @param {object} [existingIds] An object of existingIds. The function will
 * ensure that the randomId is not one of the existing ones.
 *
 * @return {string} result A random string
 */
export function generateRandomId(prefix: string, existingIds: object) {
  let randomStr;
  while (true) {
    randomStr = Math.random().toString(36).substr(2, 12);
    if (prefix && typeof prefix.valueOf() === 'string') {
      randomStr = prefix + randomStr;
    }
    if (!existingIds || !(randomStr in existingIds)) {
      break;
    }
  }
  return randomStr;
};

export type References = {
  localReference?: {
    readonly value: string
    readonly accessorProperty: string
  }
  filePath?: string
}

/*
 * Parses a [inline|relative] [model|parameter] reference in the swagger spec.
 * This method does not handle parsing paths "/subscriptions/{subscriptionId}/etc.".
 *
 * @param {string} reference Reference to be parsed.
 *
 * @return {object} result
 *         {string} [result.filePath] Filepath present in the reference. Examples are:
 *             - '../newtwork.json#/definitions/Resource' => '../network.json'
 *             - '../examples/nic_create.json' => '../examples/nic_create.json'
 *         {object} [result.localReference] Provides information about the local reference in the json document.
 *         {string} [result.localReference.value] The json reference value. Examples are:
 *           - '../newtwork.json#/definitions/Resource' => '#/definitions/Resource'
 *           - '#/parameters/SubscriptionId' => '#/parameters/SubscriptionId'
 *         {string} [result.localReference.accessorProperty] The json path expression that can be used by
 *         eval() to access the desired object. Examples are:
 *           - '../newtwork.json#/definitions/Resource' => 'definitions.Resource'
 *           - '#/parameters/SubscriptionId' => 'parameters,SubscriptionId'
 */
export function parseReferenceInSwagger(reference: string) {
  if (!reference || (reference && reference.trim().length === 0)) {
    throw new Error('reference cannot be null or undefined and it must be a non-empty string.');
  }

  let result: References = {};
  if (reference.includes('#')) {
    //local reference in the doc
    if (reference.startsWith('#/')) {
      result.localReference = {
        value: reference,
        accessorProperty: reference.slice(2).replace('/', '.'),
      }
    } else {
      //filePath+localReference
      let segments = reference.split('#');
      result.filePath = segments[0];
      result.localReference = {
        value: '#' + segments[1],
        accessorProperty: segments[1].slice(1).replace('/', '.')
      }
    }
  } else {
    //we are assuming that the string is a relative filePath
    result.filePath = reference;
  }

  return result;
};

/*
 * Same as path.join(), however, it converts backward slashes to forward slashes.
 * This is required because path.join() joins the paths and converts all the
 * forward slashes to backward slashes if executed on a windows system. This can
 * be problematic while joining a url. For example:
 * path.join('https://github.com/Azure/openapi-validation-tools/blob/master/lib', '../examples/foo.json') returns
 * 'https:\\github.com\\Azure\\openapi-validation-tools\\blob\\master\\examples\\foo.json' instead of
 * 'https://github.com/Azure/openapi-validation-tools/blob/master/examples/foo.json'
 *
 * @param variable number of arguments and all the arguments must be of type string. Similar to the API
 * provided by path.join() https://nodejs.org/dist/latest-v6.x/docs/api/path.html#path_path_join_paths
 * @return {string} resolved path
 */
export function joinPath(args: ReadonlyArray<string>) {
  let finalPath = path.join(args);
  finalPath = finalPath.replace(/\\/gi, '/');
  finalPath = finalPath.replace(/^(http|https):\/(.*)/gi, '$1://$2');
  return finalPath;
};

/*
 * Provides a parsed JSON from the given file path or a url. Same as parseJson(). However,
 * this method accepts variable number of path segments as strings and joins them together.
 * After joining the path, it internally calls parseJson().
 *
 * @param variable number of arguments and all the arguments must be of type string.
 *
 * @returns {object} jsonDoc - Parsed document in JSON format.
 */
export function parseJsonWithPathFragments(args: ReadonlyArray<string>) {
  let specPath = joinPath(args);
  return parseJson(specPath);
};

/*
 * Merges source object into the target object
 * @param {object} source The object that needs to be merged
 *
 * @param {object} target The object to be merged into
 *
 * @returns {object} target - Returns the merged target object.
 */
export function mergeObjects(source: { readonly [key: string]: unknown }, target: { [key: string]: unknown }) {
  Object.keys(source).forEach(function (key) {
    target[key] = source[key];
  });
  return target;
}

/*
 * Gets the object from the given doc based on the provided json reference pointer.
 * It returns undefined if the location is not found in the doc.
 * @param {object} doc The source object.
 *
 * @param {string} ptr The json reference pointer
 *
 * @returns {any} result - Returns the value that the ptr points to, in the doc.
 */
export function getObject(doc: object, ptr: string) {
  let result;
  try {
    result = jsonPointer.get(doc, ptr);
  } catch (err) {
    log.error(err);
    throw err;
  }
  return result;
};

/*
 * Sets the given value at the location provided by the ptr in the given doc.
 * @param {object} doc The source object.
 *
 * @param {string} ptr The json reference pointer.
 *
 * @param {any} value The value that needs to be set at the
 * location provided by the ptr in the doc.
 */
export function setObject(doc: object, ptr: string, value: unknown) {
  let result;
  try {
    result = jsonPointer.set(doc, ptr, value);
  } catch (err) {
    log.error(err);
  }
  return result;
};

/*
 * Removes the location pointed by the json pointer in the given doc.
 * @param {object} doc The source object.
 *
 * @param {string} ptr The json reference pointer.
 */
export function removeObject(doc: object, ptr: string) {
  let result;
  try {
    result = jsonPointer.remove(doc, ptr);
  } catch (err) {
    log.error(err);
  }
  return result;
};

/**
/*
 * Gets provider namespace from the given path. In case of multiple, last one will be returned.
 * @param {string} path The path of the operation.
 *                 Example "/subscriptions/{subscriptionId}/resourcegroups/{resourceGroupName}/providers/{resourceProviderNamespace}/
 *                 {parentResourcePath}/{resourceType}/{resourceName}/providers/Microsoft.Authorization/roleAssignments"
 *                 will return "Microsoft.Authorization".
 *
 * @returns {string} result - provider namespace from the given path.
 */
export function getProvider(path: string) {
  if (path === null || path === undefined || typeof path.valueOf() !== 'string' || !path.trim().length) {
    throw new Error('path is a required parameter of type string and it cannot be an empty string.');
  }

  let providerRegEx = new RegExp('/providers/(\:?[^{/]+)', 'gi');
  let result;
  let pathMatch;

  // Loop over the paths to find the last matched provider namespace
  while ((pathMatch = providerRegEx.exec(path)) != null) {
    result = pathMatch[1];
  }

  return result;
};

/*
 * Clones a github repository in the given directory.
 * @param {string} github url to be cloned.
 *                 Example "https://github.com/Azure/azure-rest-api-specs.git" or
 *                         "git@github.com:Azure/azure-rest-api-specs.git".
 *
 * @param {string} path where to clone the repository.
 */
export function gitClone(url: string, directory: string) {
  if (url === null || url === undefined || typeof url.valueOf() !== 'string' || !url.trim().length) {
    throw new Error('url is a required parameter of type string and it cannot be an empty string.');
  }

  if (directory === null || directory === undefined || typeof directory.valueOf() !== 'string' || !directory.trim().length) {
    throw new Error('directory is a required parameter of type string and it cannot be an empty string.');
  }

  // If the directory exists then we assume that the repo to be cloned is already present.
  if (fs.existsSync(directory)) {
    if (!fs.lstatSync(directory).isDirectory()) {
      throw new Error(`"${directory}" must be a directory.`);
    }
    return;
  } else {
    fs.mkdirSync(directory);
  }

  try {
    let cmd = `git clone ${url} ${directory}`;
    let result = execSync(cmd, { encoding: 'utf8' });
  } catch (err) {
    throw new Error(`An error occurred while cloning git repository: ${util.inspect(err, { depth: null })}.`);
  }
};

/*
 * Finds the first content-type that contains "/json". Only supported Content-Types are
 * "text/json" & "application/json" so we perform first best match that contains '/json'
 *
 * @param {array} consumesOrProduces Array of content-types.
 * @returns {string} firstMatchedJson content-type that contains "/json".
 */
export function getJsonContentType(consumesOrProduces: ReadonlyArray<string>) {
  let firstMatchedJson = null;
  if (consumesOrProduces) {
    firstMatchedJson = consumesOrProduces.find((contentType) => {
      return (contentType.match(/.*\/json.*/ig) !== null);
    });
  }
  return firstMatchedJson;
};

/**
 * Determines whether the given string is url encoded
 * @param {string} str - The input string to be verified.
 * @returns {boolean} result - true if str is url encoded; false otherwise.
 */
export function isUrlEncoded(str: string) {
  str = str || '';
  return str !== decodeURIComponent(str);
};

export type Model = {
  type?: string|ReadonlyArray<string>
  readonly properties?: {
    [key: string]: Model|undefined
  }
  readonly required?: ReadonlyArray<unknown>
  additionalProperties?: {
    type: ReadonlyArray<string>
  }
}

/**
 * Determines whether the given model is a pure (free-form) object candidate (i.e. equivalent of the C# Object type).
 * @param {object} model - The model to be verified
 * @returns {boolean} result - true if model is a pure object; false otherwise.
 */
export function isPureObject(model: Model) {
  if (!model) {
    throw new Error(`model cannot be null or undefined and must be of type "object"`);
  }
  if (model.type && typeof model.type.valueOf() === 'string' && model.type === 'object' && model.properties && Object.keys(model.properties).length === 0) {
    return true;
  } else if (!model.type && model.properties && Object.keys(model.properties).length === 0) {
    return true;
  } else if (model.type && typeof model.type.valueOf() === 'string' && model.type === 'object' && !model.properties) {
    return true;
  } else {
    return false;
  }
}

/**
 * Relaxes/Transforms the given entities type from a specific JSON schema primitive type (http://json-schema.org/latest/json-schema-core.html#rfc.section.4.2)
 * to an array of JSON schema primitive types (http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.21).
 *
 * @param {object} entity - The entity to be relaxed.
 * @param {boolean|undefined} [isRequired] - A boolean value that indicates whether the entity is required or not.
 * If the entity is required then the primitive type "null" is not added.
 * @returns {object} entity - The transformed entity if it is a pure object else the same entity is returned as-is.
 */
export function relaxEntityType(entity: Model, isRequired?: boolean) {
  if (isPureObject(entity)) {
    entity.type = ['array', 'boolean', 'number', 'object', 'string'];
    // if (!isRequired) {
    //   entity.type.push('null');
    // }
  }
  if (entity.additionalProperties && isPureObject(entity.additionalProperties)) {
    entity.additionalProperties.type = ['array', 'boolean', 'number', 'object', 'string'];
    // if (!isRequired) {
    //   entity.additionalProperties.type.push('null');
    // }
  }
  return entity;
};

/**
 * Relaxes/Transforms model definition like entities recursively
 */
export function relaxModelLikeEntities(model: Model) {
  model = relaxEntityType(model);
  if (model.properties) {
    let modelProperties = model.properties;
    for (let propName in modelProperties) {
      let isPropRequired = model.required ? model.required.some((p) => { return p == propName; }) : false
      const mp = modelProperties[propName]
      if (mp) {
        if (mp.properties) {
          modelProperties[propName] = relaxModelLikeEntities(mp);
        } else {
          modelProperties[propName] = relaxEntityType(mp, isPropRequired);
        }
      }
    }
  }
  return model;
}