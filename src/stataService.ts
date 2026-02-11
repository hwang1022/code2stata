import { execFile } from 'node:child_process';
import { StataApp } from './types.js';

/** Escape a string for embedding inside an AppleScript double-quoted string. */
export function escapeAppleScript(str: string): string {
    return str.replace(/[\\"]/g, '\\$&');
}

/** Run an AppleScript snippet and return stdout. */
export function runAppleScript(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
        execFile('osascript', ['-e', script], (error, stdout, stderr) => {
            if (error) {
                reject(new Error(stderr || error.message));
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

/** Check if Stata is currently running via System Events. */
export async function isStataRunning(app: StataApp): Promise<boolean> {
    const cmd = `tell application "System Events" to (name of processes) contains "${app}"`;
    const result = await runAppleScript(cmd);
    return result === 'true';
}

/** Launch Stata and wait for it to initialize. */
export async function launchStata(app: StataApp): Promise<void> {
    await runAppleScript(`tell application "${app}" to activate`);
    await sleep(3000);
}

/** Check if Stata is not busy (UtilIsStataFree). */
export async function isStataFree(app: StataApp): Promise<boolean> {
    const cmd = `tell application "${app}" to UtilIsStataFree`;
    const result = await runAppleScript(cmd);
    return result === 'true';
}

/** Send a command string to Stata via DoCommandAsync. */
export async function sendCommand(app: StataApp, command: string): Promise<void> {
    const escaped = escapeAppleScript(command);
    await runAppleScript(`tell application "${app}" to DoCommandAsync "${escaped}"`);
}

/** Activate (bring to front) the Stata window. */
export async function activateStata(app: StataApp): Promise<void> {
    await runAppleScript(`tell application "${app}" to activate`);
}

/** Get variable names from Stata's current dataset. */
export async function getVariableNameArray(app: StataApp): Promise<string[]> {
    const result = await runAppleScript(`tell application "${app}" to VariableNameArray`);
    if (!result || !result.trim()) {
        return [];
    }
    return result.split(',').map(v => v.trim().replace(/"/g, '')).filter(v => v !== '');
}

/**
 * Ensure Stata is running. If not and autoLaunch is enabled, launch it.
 * Throws if Stata isn't running and autoLaunch is disabled.
 */
export async function ensureStataAvailable(app: StataApp, autoLaunch: boolean): Promise<void> {
    const running = await isStataRunning(app);
    if (running) {
        return;
    }
    if (!autoLaunch) {
        throw new Error(`${app} is not running. Start Stata manually or enable auto-launch in settings.`);
    }
    await launchStata(app);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
