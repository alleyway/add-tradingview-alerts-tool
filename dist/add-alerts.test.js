import YAML from "yaml";
import path from "path";
import { addAlertsMain } from "./add-alerts";
import { readFileSync, writeFileSync, copyFileSync } from "fs";
import { InvalidSymbolError } from "./classes";
describe('Add Alerts Test', () => {
    it('addAlerts(configFile)', async () => {
        // create a symbols csv file as example
        const ciSymbolsCsvPath = path.join(process.cwd(), `ci_symbols.csv`);
        const csvContent = `symbol,instrument,quote_asset,alert_name
OANDA:AUDUSD/0.70874+1/OANDA:EURAUD*1.50676+1/OANDA:GBPAUD*1.77447+OANDA:AUDCHF/0.68181+OANDA:AUDCAD/0.90837+OANDA:AUDJPY/90.223+OANDA:AUDNZD/1.09412,BTC,USDT, "my CI test name"
ASDFTEST,ASDF,TEST, "creating invalid symbol"
`;
        writeFileSync(ciSymbolsCsvPath, csvContent, { encoding: "utf-8" });
        // copy blacklist file
        const templateBlacklistPath = path.join(process.cwd(), "create-tradingview-alerts-home", "src", "init", "blacklist.csv");
        copyFileSync(templateBlacklistPath, "blacklist.csv");
        // read template config file
        const templateConfigPath = path.join(process.cwd(), "create-tradingview-alerts-home", "src", "init", "config.init.yml");
        const configString = readFileSync(templateConfigPath, { encoding: "utf-8" });
        const config = YAML.parse(configString);
        // modify it to our needs
        config.files.input = ciSymbolsCsvPath;
        config.tradingview.chartUrl = process.env.TEST_TRADINGVIEW_CHART;
        config.tradingview.username = process.env.TEST_TRADINGVIEW_USERNAME;
        config.tradingview.password = process.env.TEST_TRADINGVIEW_PASSWORD;
        config.alert.actions.webhook.enabled = false;
        //config.tradingview.interval = "1h, 4h"
        // write it out again
        const TEST_CONFIG_PATH = "config.ci.yml";
        const configOutputString = YAML.stringify(config, { simpleKeys: true });
        writeFileSync(TEST_CONFIG_PATH, configOutputString, { encoding: "utf-8" });
        // launch browser and add alerts
        try {
            await addAlertsMain(TEST_CONFIG_PATH);
        }
        catch (e) {
            console.info("Test Catching what should be invalid symbol");
            if (e instanceof InvalidSymbolError) {
                expect(e.symbol).toEqual("ASDFTEST");
            }
            else {
                throw e;
            }
        }
    }, 240000);
});
//# sourceMappingURL=add-alerts.test.js.map