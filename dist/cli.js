#!/usr/bin/env node --experimental-specifier-resolution=node
import 'dotenv/config'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { Command, Argument, Option } from 'commander';
import { fetchSymbolsMain } from "./fetch-symbols";
import log from "./service/log";
import { addAlertsMain } from "./add-alerts";
import { initBaseDelay, atatVersion } from "./service/common-service";
import kleur from "kleur";
import { updateNotifier } from "./update-notifier";
import { SOURCES_AVAILABLE } from "./service/exchange-service";
import { Classification } from "./interfaces";
const program = new Command();
program
    .name("atat")
    .version(atatVersion)
    .option('-l, --loglevel <level>', 'log level (1-5), default 3')
    .option('-d, --delay <ms>', 'base delay(in ms) for how fast it runs, default 1000');
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
const initialize = () => {
    const options = program.opts();
    if (options.loglevel) {
        log.level = Number(options.loglevel);
    }
    if (options.delay) {
        initBaseDelay(Number(options.delay));
    }
    log.info(`ATAT Version: ${kleur.yellow(atatVersion)} | Node Version: ${kleur.yellow(process.version)}`);
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
    initialize();
    try {
        await fetchSymbolsMain(source, options.quoteAsset, options.classification);
        if (!options.classification) {
            log.info(kleur.gray("NOTE: If desired, you may filter by classification, see command help for details"));
        }
    }
    catch (e) {
        log.error(e);
        await checkForUpdate(false);
        process.exit(1);
    }
    await checkForUpdate(false);
});
program.command('add-alerts [config]')
    .description('add alerts')
    .action(async (config) => {
    initialize();
    try {
        await addAlertsMain(config || "config.yml");
    }
    catch (e) {
        log.error(e);
        await checkForUpdate(false);
        process.exit(1);
    }
    await checkForUpdate(false);
});
program.exitOverride();
const main = async () => {
    try {
        program.parse(process.argv);
        if (program.opts().help) {
            await checkForUpdate(false);
        }
    }
    catch (e) {
        try {
            await checkForUpdate(true);
        }
        catch (error) {
        }
        if (e.code === "commander.version" || e.code === "commander.helpDisplayed" || e.code === "commander.help") {
            process.exit(e.exitCode);
        }
        else {
            console.log(e);
            process.exit(1);
        }
    }
};
main();
//# sourceMappingURL=cli.js.map