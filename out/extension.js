"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const runCode_js_1 = require("./runCode.js");
const variableManager_js_1 = require("./variableManager.js");
const completionProvider_js_1 = require("./completionProvider.js");
function activate(context) {
    console.log('[code2stata] Extension activated.');
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('code2stata.runCode', runCode_js_1.runCode));
    context.subscriptions.push(vscode.commands.registerCommand('code2stata.getVariables', variableManager_js_1.manualRetrieve));
    // Register completion provider for 'stata' language
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('stata', new completionProvider_js_1.StataCompletionProvider()));
    // Check if Stata is running, then start auto-retrieval timer
    (0, variableManager_js_1.checkInitialStataStatus)();
    (0, variableManager_js_1.startAutoRetrieveTimer)();
    // Restart timer when config changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('code2stata')) {
            (0, variableManager_js_1.startAutoRetrieveTimer)();
        }
    }));
}
function deactivate() {
    (0, variableManager_js_1.stopAutoRetrieveTimer)();
}
//# sourceMappingURL=extension.js.map