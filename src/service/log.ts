import consola from "consola"
import kleur from "kleur";

const DEFAULT_LEVEL = 3

const log = consola.create({level: Number(process.env.ATAT_LOG_LEVEL) || DEFAULT_LEVEL})

log.info(`Current Log level: ${kleur.yellow(log.level)} (you can set env variable ATAT_LOG_LEVEL=5 for verbose logging)`)

export default log;
