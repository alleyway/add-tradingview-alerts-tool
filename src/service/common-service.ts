import log from "./log.js";
import kleur from "kleur";
import {readFile} from "fs/promises";

// @ts-ignore
const manifest = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url)));

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
        log.trace(kleur.gray(`...waiting ${kleur.bold().white(waitTime)}ms = ${kleur.yellow(`${multiplier} x`)} ${kleur.white(BASE_DELAY)}  ${message}`))
    } else {
        log.trace(kleur.gray(`...waiting ${kleur.bold().white(waitTime)}ms   ${message}`))
    }

    return new Promise((resolve) => {
        setTimeout(resolve, waitTime);
    });
}

export const isDebug = () => {
    return Boolean(process.env.DEBUG === "true")
}
