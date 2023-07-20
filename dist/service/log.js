import { createConsola } from "consola";
import kleur from "kleur";
const DEFAULT_LEVEL = 3;
const log = createConsola({ level: Number(process.env.ATAT_LOG_LEVEL) || DEFAULT_LEVEL });
export const logLogInfo = () => {
    log.info(`Current log level: ${kleur.yellow(log.level)} (you can specify '--loglevel 5' for maximum debugging)`);
};
export default log;
//# sourceMappingURL=log.js.map