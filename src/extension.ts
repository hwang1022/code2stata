import * as vscode from 'vscode';
import { runCode } from './runCode.js';
import { manualRetrieve, startAutoRetrieveTimer, stopAutoRetrieveTimer, checkInitialStataStatus } from './variableManager.js';
import { StataCompletionProvider } from './completionProvider.js';

export function activate(context: vscode.ExtensionContext): void {
    console.log('[code2stata] Extension activated.');

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('code2stata.runCode', runCode)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('code2stata.getVariables', manualRetrieve)
    );

    // Register completion provider for 'stata' language
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider('stata', new StataCompletionProvider())
    );

    // Check if Stata is running, then start auto-retrieval timer
    checkInitialStataStatus();
    startAutoRetrieveTimer();

    // Restart timer when config changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('code2stata')) {
                startAutoRetrieveTimer();
            }
        })
    );
}

export function deactivate(): void {
    stopAutoRetrieveTimer();
}
