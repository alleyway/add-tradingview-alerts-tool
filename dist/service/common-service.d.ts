export declare const initBaseDelay: (ms?: number) => void;
export declare const logBaseDelay: () => void;
export declare const atatVersion: any;
export declare const waitForTimeout: (millsOrMultplier: number, message?: string) => Promise<void>;
export declare const isEnvEnabled: (envVariable: string) => boolean;
export declare const isDebug: () => boolean;
export declare const styleOverride = "\n            div[data-dialog-name=\"gopro\"] {\n                display: none !important;\n                z-index: -1 !important;\n            }\n            \n            div:has(> div[data-qa-dialog-name=\"alert-fired\"]) {\n                display: none;\n            }\n            \n            div:has(> div[data-qa-dialog-name=\"alerts-fired\"]) {\n                display: none;\n            }        \n        ";
