/** The three possible Stata application variants. */
export type StataApp = 'stataBE' | 'stataSE' | 'stataMP';

/** Extension configuration, typed. */
export interface Code2StataConfig {
    whichApp: StataApp;
    focusWindow: boolean;
    autoLaunch: boolean;
    autoRetrieveVariables: boolean;
    autoRetrieveInterval: number;   // seconds
    retrieveTimeout: number;        // minutes
    userCommands: string[];
}
