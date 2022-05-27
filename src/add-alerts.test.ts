import YAML from "yaml";
import path from "path";
import {addAlertsMain} from "./add-alerts";
import {readFileSync, writeFileSync, copyFileSync} from "fs";
import {jest} from '@jest/globals'

describe('Add Alerts Test', () => {

    jest.setTimeout(120000)

    it('addAlerts(configFile)', async () => {

        // create a symbols csv file as example
        const ciSymbolsCsvPath = path.join(process.cwd(), `ci_symbols.csv`)
        const csvContent =
            `symbol,instrument,quote_asset,alert_name
COINBASE:BTCUSD,BTC,USDT, "my CI test name"
`
        writeFileSync(ciSymbolsCsvPath, csvContent, {encoding: "utf-8"});


        // copy blacklist file
        const templateBlacklistPath = path.join(process.cwd(), "create-tradingview-alerts-home", "src", "init", "blacklist.csv")
        copyFileSync(templateBlacklistPath, "blacklist.csv")

        // read template config file
        const templateConfigPath = path.join(process.cwd(), "create-tradingview-alerts-home", "src", "init", "config.init.yml")
        const configString = readFileSync(templateConfigPath, {encoding: "utf-8"})
        const config = YAML.parse(configString)

        // modify it to our needs

        config.files.input = ciSymbolsCsvPath

        config.tradingview.chartUrl = process.env.TEST_TRADINGVIEW_CHART
        config.tradingview.username = process.env.TEST_TRADINGVIEW_USERNAME
        config.tradingview.password = process.env.TEST_TRADINGVIEW_PASSWORD
        config.alert.actions.webhook.enabled = false

        //config.tradingview.interval = "1h, 4h"

        // write it out again
        const TEST_CONFIG_PATH = "config.ci.yml";
        const configOutputString = YAML.stringify(config, {simpleKeys:true})
        writeFileSync(TEST_CONFIG_PATH, configOutputString, {encoding: "utf-8"});


        // launch browser and add alerts

        await addAlertsMain(TEST_CONFIG_PATH)



    });


})
