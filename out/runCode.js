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
exports.runCode = runCode;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("node:fs"));
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const config_js_1 = require("./config.js");
const stata = __importStar(require("./stataService.js"));
const variableManager_js_1 = require("./variableManager.js");
const MAX_COMMAND_LENGTH = 8192;
/** Run code command handler. Sends selected code or entire file to Stata. */
async function runCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No editor is open. Open a file and try again.');
        return;
    }
    const config = (0, config_js_1.getConfig)();
    const { whichApp, autoLaunch, focusWindow } = config;
    const selection = editor.selection;
    let codeToRun;
    let useTempFile;
    if (!selection.isEmpty) {
        // Selected text: expand to full lines
        codeToRun = getExpandedSelection(editor);
        useTempFile = true;
    }
    else {
        // No selection: run entire file
        codeToRun = editor.document.getText();
        if (!codeToRun.trim()) {
            vscode.window.showErrorMessage('The editor is empty. Add some Stata code and try again.');
            return;
        }
        useTempFile = editor.document.isUntitled;
    }
    try {
        await stata.ensureStataAvailable(whichApp, autoLaunch);
        if (focusWindow) {
            await stata.activateStata(whichApp);
        }
        let command;
        if (useTempFile) {
            const tempPath = writeTempDoFile(codeToRun);
            command = `do ${tempPath}`;
        }
        else {
            // Saved file — use Stata's compound double-quote for paths with spaces
            const filePath = editor.document.uri.fsPath;
            command = `do \`"${filePath}"'`;
        }
        if (command.length > MAX_COMMAND_LENGTH) {
            vscode.window.showErrorMessage(`Command exceeds ${MAX_COMMAND_LENGTH} character limit.`);
            return;
        }
        await stata.sendCommand(whichApp, command);
        // Retrieve variables after running (fire-and-forget, don't block user)
        (0, variableManager_js_1.postRunRetrieve)();
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Failed to run code: ${msg}`);
    }
}
/**
 * Expand the current selection to full lines and return the text.
 * Ported from old extension's runSmart command.
 */
function getExpandedSelection(editor) {
    const selection = editor.selection;
    const doc = editor.document;
    const startLine = selection.start.line;
    let endLine = selection.end.line;
    // If cursor is at column 0 of the last line (common when shift-selecting
    // down), don't include that empty trailing line.
    if (selection.end.character === 0 && endLine > startLine) {
        endLine--;
    }
    const firstLineStart = new vscode.Position(startLine, 0);
    const lastLineEnd = doc.lineAt(endLine).range.end;
    const expandedRange = new vscode.Range(firstLineStart, lastLineEnd);
    return doc.getText(expandedRange);
}
/** Write code to a temporary .do file and return its path. */
function writeTempDoFile(code) {
    const fileName = `Code2Stata${Date.now()}.do`;
    const filePath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(filePath, code + '\n', 'utf-8');
    return filePath;
}
//# sourceMappingURL=runCode.js.map