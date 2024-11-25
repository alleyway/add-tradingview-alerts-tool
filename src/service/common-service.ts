import log from "./log.js";
import kleur from "kleur";
// import {readFile} from "fs/promises";


/*
    There's an annoying thing here where the experimental module flag has some breaking changes
    that require import assertions starting from node 16.14

    so the solution is to have this file(only) transpiled by babel
    UPDATE: v22 switch using "assert" for "with"
 */
import manifest from "../manifest.json" with {"type": "json"}
// import manifest from "../manifest.json"

// @ts-ignore
// const manifest = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url)));

let BASE_DELAY = Number(process.env.BASE_DELAY) || 1000;

export const initBaseDelay = (ms: number = 1000) => {
    BASE_DELAY = ms
}

export const logBaseDelay = () => {
    log.info(`Base delay: ${kleur.yellow(BASE_DELAY)} (you can specify '--delay 1000' (or env variable BASE_DELAY) to increase/decrease speed)`)
}


export const atatVersion = manifest.version

export const waitForTimeout = (millsOrMultplier: number, message: string = ""): Promise<void> => {

    let waitTime = millsOrMultplier
    let multiplier = 1
    if (millsOrMultplier < 20) {
        multiplier = millsOrMultplier
        waitTime = Math.round(((BASE_DELAY * millsOrMultplier) / 1000) * 1000)
        log.debug(kleur.gray(`...waiting ${kleur.bold().white(waitTime)}ms = ${kleur.yellow(`${multiplier} x`)} ${kleur.white(BASE_DELAY)}  ${message}`))
    } else {
        log.debug(kleur.gray(`...waiting ${kleur.bold().white(waitTime)}ms   ${message}`))
    }

    return new Promise((resolve) => {
        setTimeout(resolve, waitTime);
    });
}

export const isEnvEnabled = (envVariable: string) => {
    return (!!envVariable && (envVariable === "true" || Boolean(Number(envVariable))))
}

export const isDebug = () => {
    return isEnvEnabled(process.env.DEBUG)
}

export const styleOverride =  `
            div[data-dialog-name="gopro"] {
                display: none !important;
                z-index: -1 !important;
            }
            
            div:has(> div[data-qa-dialog-name="alert-fired"]) {
                display: none;
            }
            
            div:has(> div[data-qa-dialog-name="alerts-fired"]) {
                display: none;
            }        
        `;
