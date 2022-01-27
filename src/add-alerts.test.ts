import YAML from "yaml";
import * as fs from "fs";
import path from "path";
import {addAlertsMain} from "./add-alerts";


describe('Add Alerts Test', () => {

    jest.setTimeout(120000)

    it('addAlerts(configFile)', async () => {

        // create a symbols csv file as example
        const ciSymbolsCsvPath = path.join(process.cwd(), `ci_symbols.csv`)
        const csvContent =
            `symbol,base,quote,name
COINBASE:BTCUSD,BTC,USDT, "my CI test name"
`
        fs.writeFileSync(ciSymbolsCsvPath, csvContent, {encoding: "utf-8"});


        // copy blacklist file
        const templateBlacklistPath = path.join(process.cwd(), "create-tradingview-alerts-home", "src", "init", "blacklist.csv")
        fs.copyFileSync(templateBlacklistPath, "blacklist.csv")

        // read template config file
        const templateConfigPath = path.join(process.cwd(), "create-tradingview-alerts-home", "src", "init", "config.init.yml")
        const configString = await fs.readFileSync(templateConfigPath, {encoding: "utf-8"})
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
        fs.writeFileSync(TEST_CONFIG_PATH, configOutputString, {encoding: "utf-8"});


        // launch browser and add alerts

        await addAlertsMain(TEST_CONFIG_PATH)



    });


})
