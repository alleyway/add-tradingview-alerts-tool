#!/usr/bin/env node
import 'dotenv/config' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import program from "./program.js"
// eg
// process.argv =  [/Users/HIDDEN/.nvm/versions/node/v16.13.1/bin/node, /Users/HIDDEN/alleyway/add-tradingview-alerts-tool/dist/cli.js]
program.parse(process.argv);


