import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { getConfig } from './config.js';
import * as stata from './stataService.js';
import { postRunRetrieve } from './variableManager.js';

const MAX_COMMAND_LENGTH = 8192;

/** Run code command handler. Sends selected code or entire file to Stata. */
export async function runCode(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No editor is open. Open a file and try again.');
        return;
    }

    const config = getConfig();
    const { whichApp, autoLaunch, focusWindow } = config;

    const selection = editor.selection;
    let codeToRun: string;
    let useTempFile: boolean;

    if (!selection.isEmpty) {
        // Selected text: expand to full lines
        codeToRun = getExpandedSelection(editor);
        useTempFile = true;
    } else {
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

        let command: string;
        if (useTempFile) {
            const tempPath = writeTempDoFile(codeToRun);
            command = `do ${tempPath}`;
        } else {
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
        postRunRetrieve();

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Failed to run code: ${msg}`);
    }
}

/**
 * Expand the current selection to full lines and return the text.
 * Ported from old extension's runSmart command.
 */
function getExpandedSelection(editor: vscode.TextEditor): string {
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
function writeTempDoFile(code: string): string {
    const fileName = `Code2Stata${Date.now()}.do`;
    const filePath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(filePath, code + '\n', 'utf-8');
    return filePath;
}
