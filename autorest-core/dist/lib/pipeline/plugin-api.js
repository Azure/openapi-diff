"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.IAutoRestPluginInitiator_Types = exports.IAutoRestPluginTarget_Types = void 0;
const jsonrpc_1 = require("../ref/jsonrpc");
const jsonrpc_2 = require("../ref/jsonrpc");
var IAutoRestPluginTarget_Types;
(function (IAutoRestPluginTarget_Types) {
    IAutoRestPluginTarget_Types.GetPluginNames = new jsonrpc_1.RequestType0("GetPluginNames");
    IAutoRestPluginTarget_Types.Process = new jsonrpc_1.RequestType2("Process");
})(IAutoRestPluginTarget_Types = exports.IAutoRestPluginTarget_Types || (exports.IAutoRestPluginTarget_Types = {}));
var IAutoRestPluginInitiator_Types;
(function (IAutoRestPluginInitiator_Types) {
    IAutoRestPluginInitiator_Types.ReadFile = new jsonrpc_1.RequestType2("ReadFile");
    IAutoRestPluginInitiator_Types.GetValue = new jsonrpc_1.RequestType2("GetValue");
    IAutoRestPluginInitiator_Types.ListInputs = new jsonrpc_1.RequestType2("ListInputs");
    IAutoRestPluginInitiator_Types.WriteFile = new jsonrpc_2.NotificationType4("WriteFile");
    /* @internal */ IAutoRestPluginInitiator_Types.Message = new jsonrpc_2.NotificationType4("Message");
})(IAutoRestPluginInitiator_Types = exports.IAutoRestPluginInitiator_Types || (exports.IAutoRestPluginInitiator_Types = {}));
//# sourceMappingURL=plugin-api.js.map