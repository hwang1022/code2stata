"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeAppleScript = escapeAppleScript;
exports.runAppleScript = runAppleScript;
exports.isStataRunning = isStataRunning;
exports.launchStata = launchStata;
exports.isStataFree = isStataFree;
exports.sendCommand = sendCommand;
exports.activateStata = activateStata;
exports.getVariableNameArray = getVariableNameArray;
exports.ensureStataAvailable = ensureStataAvailable;
const node_child_process_1 = require("node:child_process");
/** Escape a string for embedding inside an AppleScript double-quoted string. */
function escapeAppleScript(str) {
    return str.replace(/[\\"]/g, '\\$&');
}
/** Run an AppleScript snippet and return stdout. */
function runAppleScript(script) {
    return new Promise((resolve, reject) => {
        (0, node_child_process_1.execFile)('osascript', ['-e', script], (error, stdout, stderr) => {
            if (error) {
                reject(new Error(stderr || error.message));
            }
            else {
                resolve(stdout.trim());
            }
        });
    });
}
/** Check if Stata is currently running via System Events. */
async function isStataRunning(app) {
    const cmd = `tell application "System Events" to (name of processes) contains "${app}"`;
    const result = await runAppleScript(cmd);
    return result === 'true';
}
/** Launch Stata and wait for it to initialize. */
async function launchStata(app) {
    await runAppleScript(`tell application "${app}" to activate`);
    await sleep(3000);
}
/** Check if Stata is not busy (UtilIsStataFree). */
async function isStataFree(app) {
    const cmd = `tell application "${app}" to UtilIsStataFree`;
    const result = await runAppleScript(cmd);
    return result === 'true';
}
/** Send a command string to Stata via DoCommandAsync. */
async function sendCommand(app, command) {
    const escaped = escapeAppleScript(command);
    await runAppleScript(`tell application "${app}" to DoCommandAsync "${escaped}"`);
}
/** Activate (bring to front) the Stata window. */
async function activateStata(app) {
    await runAppleScript(`tell application "${app}" to activate`);
}
/** Get variable names from Stata's current dataset. */
async function getVariableNameArray(app) {
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
async function ensureStataAvailable(app, autoLaunch) {
    const running = await isStataRunning(app);
    if (running) {
        return;
    }
    if (!autoLaunch) {
        throw new Error(`${app} is not running. Start Stata manually or enable auto-launch in settings.`);
    }
    await launchStata(app);
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=stataService.js.map