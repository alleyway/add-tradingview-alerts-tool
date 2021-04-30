#!/usr/bin/env node
import 'source-map-support/register.js'
import {Command} from 'commander';
import fetchPairsMain from "./fetch-pairs.js";
import {readFile} from 'fs/promises';
import log from "./service/log.js";
import addAlertsMain from "./add-alerts.js";
import {initBaseDelay} from "./service/common-service.js";
import initializeMain from "./initialize.js";
// @ts-ignore
const json = JSON.parse(await readFile(new URL('./manifest.json', import.meta.url)));

const program = new Command();

program
    .version(json.version)
    .option('-l, --loglevel <level>', 'log level (1-5), default 3')
    .option('-d, --delay <ms>', 'base delay(in ms) for how fast it runs, default 1000')

const initialize = () => {
    const options = program.opts();
    if (options.debug) {
        log.level = Number(options.debug)
    }
    if (options.delay) {
        initBaseDelay(Number(options.delay))
    }
}


program.command('init')
    .description('initialize with config')
    .action(async (exchange, quote) => {
        initialize()
        await initializeMain()
    })


program.command('fetch-pairs <exchange> [quote]')
    .description('fetch trading pairs for exchange')
    .action(async (exchange, quote) => {
        initialize()
        await fetchPairsMain(exchange, quote || "all")
    })

program.command('add-alerts [config]')
    .description('add alerts')
    .action(async (config) => {
        initialize()
        try {
            await addAlertsMain(config || "config.yml")
        } catch (e) {
            log.error(e)
            process.exit(1)
        }
    })


program.parse(process.argv);
