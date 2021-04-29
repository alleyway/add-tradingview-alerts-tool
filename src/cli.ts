#!/usr/bin/env node
import {Command} from 'commander';
import fetchPairsMain from "./fetch-pairs.js";
import version from "./version.json"
const program = new Command();

program
    .version("1.2.2")
    .option('-d, --debug <level>', 'debug level (1-5)')


program.command('fetch-pairs <exchange> <quote-asset>')
    .description('fetch trading pairs for exchange')
    .action(async (exchange, quote) => {
        await fetchPairsMain(exchange, quote)
    })

program.command('add-alerts [config]')
    .description('add alerts')
    .action(async (config) => {
        console.log("config")
        //await fetchPairsMain(exchange, quote)
    })



program.parse(process.argv);

// const options = program.opts();
//
// if (options.debug) console.log(options);
//
// console.log('pizza details:');
//
// if (options.small) console.log('- small pizza size');
//
// if (options.pizzaType) console.log(`- ${options.pizzaType}`);
