import * as vscode from 'vscode';
import { getConfig } from './config.js';
import * as stata from './stataService.js';

/** Current variable list, readable by the completion provider. */
let variables: string[] = [];

/** Handle for the auto-retrieval setInterval timer. */
let autoRetrieveTimer: ReturnType<typeof setInterval> | undefined;

/** Whether auto-retrieval is currently paused due to an error. */
let autoRetrievePaused = false;

/** Get the current variable list. */
export function getVariables(): readonly string[] {
    return variables;
}

/**
 * Core retrieval function with backoff.
 *
 * If `launch` is true, Stata will be auto-launched if not running (used by
 * manual retrieval and post-code-run). If false, throws when Stata is not
 * running (used by the timed auto-retrieval, which should never launch Stata).
 *
 * 1. Check if Stata is running (optionally launch).
 * 2. Wait 1 second (initial wait).
 * 3. Check isStataFree — if free, get variables.
 * 4. If busy: progressive backoff — wait 1s, 2s, 3s, ..., 30s between retries.
 * 5. If elapsed > retrieveTimeout minutes: throw timeout error.
 * 6. On success: clear autoRetrievePaused.
 */
async function retrieveVariables(launch: boolean): Promise<string[]> {
    const config = getConfig();
    const { whichApp, retrieveTimeout } = config;

    // Step 1: Check if Stata is running
    const running = await stata.isStataRunning(whichApp);
    if (!running) {
        if (launch && config.autoLaunch) {
            await stata.launchStata(whichApp);
        } else {
            throw new Error(`${whichApp} is not running.`);
        }
    }

    const timeoutMs = retrieveTimeout * 60 * 1000;
    const startTime = Date.now();

    // Step 2: Initial 1-second wait
    await sleep(1000);

    // Step 3+4: Check if free, with progressive backoff if busy
    let attempt = 0;
    while (true) {
        const elapsed = Date.now() - startTime;
        if (elapsed >= timeoutMs) {
            throw new Error(
                `Timeout: Stata remained busy for over ${retrieveTimeout} minutes.`
            );
        }

        const free = await stata.isStataFree(whichApp);
        if (free) {
            const vars = await stata.getVariableNameArray(whichApp);
            variables = vars;
            autoRetrievePaused = false;
            return vars;
        }

        // Progressive backoff: 1s, 2s, 3s, ..., 30s
        attempt++;
        const waitSeconds = Math.min(attempt, 30);
        await sleep(waitSeconds * 1000);
    }
}

/**
 * Manual retrieval command handler. Shows UI feedback.
 * Resets the auto-retrieval timer on success.
 */
export async function manualRetrieve(): Promise<void> {
    try {
        const vars = await retrieveVariables(true);
        resetAutoRetrieveTimer();
        if (vars.length > 0) {
            vscode.window.showInformationMessage(
                `Retrieved ${vars.length} variable(s) from Stata.`
            );
        } else {
            vscode.window.showWarningMessage('No variables found in current dataset.');
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        autoRetrievePaused = true;
        vscode.window.showErrorMessage(`Failed to retrieve variables: ${msg}`);
    }
}

/**
 * Post-code-run retrieval. Called after code is sent to Stata.
 * Waits for Stata to finish (backoff), then retrieves variables.
 * Resets the auto-retrieval timer on success.
 * Does not show UI messages — only logs.
 */
export async function postRunRetrieve(): Promise<void> {
    try {
        await retrieveVariables(true);
        resetAutoRetrieveTimer();
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[code2stata] Post-run variable retrieval failed: ${msg}`);
        autoRetrievePaused = true;
    }
}

/**
 * Check if Stata is running when the extension activates.
 * If not, inform the user and pause auto-retrieval.
 */
export async function checkInitialStataStatus(): Promise<void> {
    const config = getConfig();
    if (!config.autoRetrieveVariables) {
        return;
    }
    const running = await stata.isStataRunning(config.whichApp);
    if (!running) {
        autoRetrievePaused = true;
        vscode.window.showInformationMessage(
            'Stata is not running. Auto variable retrieval is temporarily disabled.'
        );
    }
}

/**
 * Start the auto-retrieval timer. Called on activation and when config changes.
 * Stops any existing timer first.
 */
export function startAutoRetrieveTimer(): void {
    stopAutoRetrieveTimer();

    const config = getConfig();
    if (!config.autoRetrieveVariables || config.autoRetrieveInterval <= 0) {
        return;
    }

    const intervalMs = config.autoRetrieveInterval * 1000;

    autoRetrieveTimer = setInterval(async () => {
        if (autoRetrievePaused) {
            return;
        }
        try {
            await retrieveVariables(false);
        } catch {
            autoRetrievePaused = true;
        }
    }, intervalMs);
}

/** Stop the auto-retrieval timer. */
export function stopAutoRetrieveTimer(): void {
    if (autoRetrieveTimer !== undefined) {
        clearInterval(autoRetrieveTimer);
        autoRetrieveTimer = undefined;
    }
}

/** Reset the auto-retrieval timer countdown (stop + start). */
function resetAutoRetrieveTimer(): void {
    const config = getConfig();
    if (config.autoRetrieveVariables) {
        startAutoRetrieveTimer();
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
