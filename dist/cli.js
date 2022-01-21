#!/usr/bin/env node --experimental-specifier-resolution=node
import 'source-map-support/register';
import { Command } from 'commander';
import { fetchSymbolsMain } from "./fetch-symbols";
import log from "./service/log";
import { addAlertsMain } from "./add-alerts";
import { initBaseDelay, atatVersion } from "./service/common-service";
import kleur from "kleur";
import { updateNotifier } from "./update-notifier";
import { sourcesAvailable } from "./service/exchange-service";
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
    
    ${kleur.green(sourcesAvailable.map((val) => val.toUpperCase()).join(kleur.gray(", ")))}
    
    Optionally, you may filter results to a particular ${kleur.yellow("<quoteAsset>")} such as BTC, ETH, USDT, BUSD, etc.

    example: ${kleur.dim("atat fetch-symbols COINBASE ETH")}     
         
    `;
program.command('fetch-symbols <source> [quoteAsset]').showHelpAfterError(extendedHelp)
    .description('fetch trading symbols for an exchange').addHelpText("after", extendedHelp)
    .action(async (source, quoteAsset) => {
    initialize();
    try {
        await fetchSymbolsMain(source, quoteAsset);
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