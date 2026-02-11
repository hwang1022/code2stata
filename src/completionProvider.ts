import * as vscode from 'vscode';
import { STATA_COMMANDS } from './stataCommands.js';
import { getVariables } from './variableManager.js';
import { getConfig } from './config.js';

export class StataCompletionProvider implements vscode.CompletionItemProvider {

    provideCompletionItems(
        document: vscode.TextDocument,
        _position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ): vscode.CompletionItem[] {

        if (document.languageId !== 'stata') {
            return [];
        }

        const items: vscode.CompletionItem[] = [];

        // Built-in Stata commands
        for (const cmd of STATA_COMMANDS) {
            const item = new vscode.CompletionItem(cmd, vscode.CompletionItemKind.Keyword);
            item.detail = 'Stata Command';
            items.push(item);
        }

        // User-defined commands from settings
        const config = getConfig();
        for (const cmd of config.userCommands) {
            const item = new vscode.CompletionItem(cmd, vscode.CompletionItemKind.Keyword);
            item.detail = 'User Command';
            items.push(item);
        }

        // Variables from Stata's memory
        for (const varName of getVariables()) {
            const item = new vscode.CompletionItem(varName, vscode.CompletionItemKind.Variable);
            item.detail = 'Stata Variable';
            items.push(item);
        }

        return items;
    }
}
