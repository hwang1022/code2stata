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
exports.StataCompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
const stataCommands_js_1 = require("./stataCommands.js");
const variableManager_js_1 = require("./variableManager.js");
const config_js_1 = require("./config.js");
class StataCompletionProvider {
    provideCompletionItems(document, _position, _token, _context) {
        if (document.languageId !== 'stata') {
            return [];
        }
        const items = [];
        // Built-in Stata commands
        for (const cmd of stataCommands_js_1.STATA_COMMANDS) {
            const item = new vscode.CompletionItem(cmd, vscode.CompletionItemKind.Keyword);
            item.detail = 'Stata Command';
            items.push(item);
        }
        // User-defined commands from settings
        const config = (0, config_js_1.getConfig)();
        for (const cmd of config.userCommands) {
            const item = new vscode.CompletionItem(cmd, vscode.CompletionItemKind.Keyword);
            item.detail = 'User Command';
            items.push(item);
        }
        // Variables from Stata's memory
        for (const varName of (0, variableManager_js_1.getVariables)()) {
            const item = new vscode.CompletionItem(varName, vscode.CompletionItemKind.Variable);
            item.detail = 'Stata Variable';
            items.push(item);
        }
        return items;
    }
}
exports.StataCompletionProvider = StataCompletionProvider;
//# sourceMappingURL=completionProvider.js.map