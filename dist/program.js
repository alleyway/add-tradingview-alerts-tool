import { Command, Argument, Option } from 'commander';
import { fetchSymbolsMain } from "./fetch-symbols.js";
import log from "./service/log.js";
import { addAlertsMain } from "./add-alerts.js";
import { initBaseDelay, atatVersion } from "./service/common-service.js";
import kleur from "kleur";
import { updateNotifier } from "./update-notifier.js";
import { SOURCES_AVAILABLE } from "./service/exchange-service.js";
import { Classification } from "./interfaces.js";
const program = new Command();
program.configureOutput({
    outputError: (str, write) => write(kleur.red(str))
});
program
    .name("atat")
    .version(atatVersion)
    .option('-l, --loglevel <level>', 'log level (1-5), default 3');
const checkForUpdate = async (verbose) => {
    if (verbose) {
        log.info(kleur.gray("Checking for ATAT update..."));
    }
    const message = await updateNotifier(atatVersion);
    if (message) {
        console.log(message);
    }
    else {
        if (verbose) {
            log.success("Looks like you're running the latest version");
        }
    }
};
const wrapper = async (workFunction) => {
    log.info(`ATAT Version: ${kleur.yellow(atatVersion)} | Node Version: ${kleur.yellow(process.version)}`);
    const options = program.optsWithGlobals();
    if (options.loglevel) {
        log.level = Number(options.loglevel);
    }
    try {
        await workFunction();
    }
    catch (e) {
        log.error(e.message);
        await checkForUpdate(true);
    }
    finally {
        await checkForUpdate(false);
    }
};
program.command('fetch-pairs [exchange] [quote]', { hidden: true })
    .description('DEPRECATED! use "fetch-symbols" instead')
    .action((exchange, quote) => {
    log.error(`fetch-pairs is now ${kleur.red("DEPRECATED")}. Use 'fetch-symbols' instead`);
});
const extendedHelp = `
Where ${kleur.yellow("<source>")} is one of the following:

    ${kleur.green(SOURCES_AVAILABLE.map((val) => val.toLowerCase()).join(kleur.gray("\n    ")))}

    Optionally, you may filter results to a particular ${kleur.yellow("<quote_asset>")} such as btc, eth, usdt, busd, etc.

    example: ${kleur.dim("atat fetch-symbols coinbase -q eth")}

    `;
program.command('fetch-symbols')
    .addArgument(new Argument('<source>', 'exchange').choices(SOURCES_AVAILABLE))
    .addOption(new Option("-q, --quote-asset <quote-asset>", "only symbols matching quote asset (eg. 'usdt' or 'btc')"))
    .addOption(new Option("-c, --classification <classification>", "only symbols matching classification").choices(Object.keys(Classification).map((s) => s.toLowerCase())))
    // .showHelpAfterError(extendedHelp)
    .description('fetch trading symbols from an exchange').addHelpText("after", extendedHelp)
    .action(async (source, options) => {
    return wrapper(async () => {
        await fetchSymbolsMain(source, options.quoteAsset, options.classification);
        if (!options.classification) {
            log.info(kleur.gray("NOTE: If desired, you may filter by classification, see command help for details"));
        }
    });
});
program.command('add-alerts [config]')
    .description('add alerts')
    .addOption(new Option('-d, --delay <ms>', 'base delay(in ms) for how fast it runs, default 1000'))
    .action((config, options) => {
    return wrapper(async () => {
        if (options.delay) {
            initBaseDelay(Number(options.delay));
        }
        await addAlertsMain(config || "config.yml");
    });
});
export default program;
//# sourceMappingURL=program.js.map