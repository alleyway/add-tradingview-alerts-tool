#!/usr/bin/env node
import 'source-map-support/register.js';
import { Command } from 'commander';
import fetchPairsMain from "./fetch-pairs.js";
import log from "./service/log.js";
import addAlertsMain from "./add-alerts.js";
import { initBaseDelay, atatVersion } from "./service/common-service.js";
import kleur from "kleur";
import updateNotifier from "./update-notifier.js";
import { exchangesAvailable } from "./service/exchange-service.js";
const program = new Command();
program
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
program.command('fetch-pairs <exchange> [quote]')
    .description('fetch trading pairs for exchange').addHelpText("after", `
    
    Where <exchange> is one of the following:
    ${exchangesAvailable.join(", ")}
    
    And <quote> represents the quote asset (eg. BTC, ETH, USDT, BNB)
    
    Note: use "ftx perp" to get all ftx perpetual contracts 
    `)
    .action(async (exchange, quote) => {
    initialize();
    try {
        await fetchPairsMain(exchange, quote || "all");
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
        if (e.code === "commander.version" || e.code === "commander.helpDisplayed") {
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