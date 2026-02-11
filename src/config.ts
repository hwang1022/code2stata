import * as vscode from 'vscode';
import { Code2StataConfig, StataApp } from './types.js';

/** Read the extension configuration fresh from workspace settings. */
export function getConfig(): Code2StataConfig {
    const cfg = vscode.workspace.getConfiguration('code2stata');
    return {
        whichApp: cfg.get<StataApp>('whichApp', 'stataSE'),
        focusWindow: cfg.get<boolean>('focusWindow', true),
        autoLaunch: cfg.get<boolean>('autoLaunch', true),
        autoRetrieveVariables: cfg.get<boolean>('autoRetrieveVariables', true),
        autoRetrieveInterval: cfg.get<number>('autoRetrieveInterval', 30),
        retrieveTimeout: cfg.get<number>('retrieveTimeout', 30),
        userCommands: cfg.get<string[]>('userCommands', []),
    };
}
