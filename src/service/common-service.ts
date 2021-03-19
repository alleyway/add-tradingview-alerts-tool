import log from "./log.js";
import kleur from "kleur";

const BASE_DELAY = Number(process.env.BASE_DELAY) || 1000;

log.info(`Base delay: ${kleur.yellow(BASE_DELAY)} (you can set env variable BASE_DELAY=1000 to increase/decrease speed)`)

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
