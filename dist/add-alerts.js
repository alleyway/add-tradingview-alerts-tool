import * as csv from 'fast-csv';
import { createReadStream, existsSync, readFileSync } from "fs";
import YAML from "yaml";
import { addAlert, configureInterval, isEnvEnabled, waitForTimeout, isXpathVisible } from "./index.js";
import { checkForInvalidSymbol, launchBrowser, login, minimizeFooterChartPanel, navigateToSymbol } from "./service/tv-page-actions.js";
import { soundNames, isSoundName, isSoundDuration, soundDurations } from "./interfaces.js";
import log, { logLogInfo } from "./service/log.js";
import kleur from "kleur";
import { logBaseDelay, styleOverride } from "./service/common-service.js";
import { InvalidSymbolError } from "./classes.js";
const readFilePromise = (filename) => {
    return new Promise((resolve, reject) => {
        const rows = [];
        if (!existsSync(filename))
            reject(`File specified in config was not found: ${kleur.yellow(filename)}`);
        try {
            const readStream = createReadStream(filename);
            readStream
                // .pipe(stripBomStream()) // was an error using this package something about module resolution
                .pipe(csv.parse({
                headers: (headerArray) => headerArray.map((header) => header.trim())
            }))
                .on('data', (row) => rows.push(row))
                .on('end', (rowCount) => {
                log.info(`Parsed ${rowCount} rows`);
                resolve(rows);
            }).on('error', (e) => {
                reject(`Unable to read csv: ${e.message}`);
            });
        }
        catch (e) {
            reject(e.message);
        }
    });
};
export const addAlertsMain = async (configFileName) => {
    const headless = isEnvEnabled(process.env.HEADLESS);
    logLogInfo();
    logBaseDelay();
    if (!existsSync(configFileName)) {
        log.error(`Unable to find config file: ${configFileName}`);
        process.exit(1);
    }
    log.info("Using config file: ", kleur.yellow(configFileName));
    log.info("Press Ctrl-C to stop this script");
    const configString = readFileSync(configFileName, { encoding: "utf-8" });
    const config = YAML.parse(configString);
    if (config.tradingview.chartUrl === "https://www.tradingview.com/chart/XXXXXXXX/") {
        log.fatal("oops! Looks like you need to set your chartUrl in the config file!");
        process.exit(1);
    }
    let blackListRows = [];
    if (config.files.exclude) {
        try {
            log.info(`${kleur.gray("Reading blacklist file: ")}${kleur.cyan(config.files.exclude)}`);
            blackListRows = await readFilePromise(config.files.exclude);
            if (blackListRows.length > 0) {
                if (!blackListRows[0].symbol) {
                    log.error(`Invalid csv file format(${config.files.exclude}), first line must have at the following header: ${kleur.blue("symbol")}`);
                    process.exit(1);
                }
            }
        }
        catch (e) {
            log.fatal(`Unable to open file specified in config: ${config.files.exclude}`);
            process.exit(1);
        }
    }
    let symbolRows = [];
    try {
        log.info(`${kleur.gray("Reading input file: ")}${kleur.cyan(config.files.input)}`);
        symbolRows = await readFilePromise(config.files.input);
    }
    catch (e) {
        log.fatal(`Unable to open file specified in config: ${kleur.yellow(config.files.input)}`);
        process.exit(1);
    }
    const firstRow = symbolRows[0];
    if (!firstRow.symbol) {
        log.error(`Invalid input csv file format, first line should have at least the following headers(no spaces!): ${kleur.blue("symbol,instrument,quote_asset")}`);
        process.exit(1);
    }
    const { alert: alertConfig } = config;
    if (alertConfig.actions.playSound && alertConfig.actions.playSound.enabled) {
        if (!isSoundName(alertConfig.actions.playSound.name)) {
            log.error(`Configuration error. Invalid sound name: ${kleur.yellow(alertConfig.actions.playSound.name)}`);
            throw new Error(`Sound must be one of: ${soundNames.join(" , ")}`);
        }
        if (!isSoundDuration(alertConfig.actions.playSound.duration)) {
            log.error(`Configuration error. Invalid sound duration: ${kleur.yellow(alertConfig.actions.playSound.duration)}`);
            throw new Error(`Sound Duration must be one of: ${soundDurations.join(" , ")}`);
        }
    }
    const browser = await launchBrowser(headless, `${config.tradingview.chartUrl}#signin`);
    let page;
    let accessDenied;
    if (headless) {
        page = await browser.newPage();
        log.debug(`Go to ${config.tradingview.chartUrl} and wait until domloaded`);
        const pageResponse = await page.goto(config.tradingview.chartUrl + "#signin", {
            waitUntil: 'domcontentloaded'
        });
        await waitForTimeout(8, "let page load and see if access is denied");
        /* istanbul ignore next */
        await page.addStyleTag({ content: styleOverride });
        accessDenied = pageResponse.status() === 403;
    }
    else {
        page = (await browser.pages())[0];
        await waitForTimeout(5, "let page load and see if access is denied");
        await page.addStyleTag({ content: styleOverride });
        /* istanbul ignore next */
        accessDenied = await page.evaluate(() => {
            return document.title.includes("Denied");
        });
    }
    const isShowingSignIn = await isXpathVisible(page, `//div[@data-dialog-name='sign-in']`);
    if (accessDenied || isShowingSignIn) {
        if (config.tradingview.username && config.tradingview.password) {
            await login(page, config.tradingview.username, config.tradingview.password);
        }
        else {
            log.warn("You'll need to sign into TradingView in this browser (one time only)\n...after signing in, press ctrl-c to kill this script, then run it again");
            await waitForTimeout(1000000);
            await browser.close();
            process.exit(1);
        }
    }
    await waitForTimeout(3, "wait a little longer for page to load");
    const isBlacklisted = (symbol) => {
        for (const row of blackListRows) {
            if (symbol.toLowerCase().includes(row.symbol.toLowerCase())) {
                return true;
            }
        }
        return false;
    };
    await minimizeFooterChartPanel(page); // otherwise pine script editor might capture focus
    for (const row of symbolRows) {
        try {
            const makeReplacements = (value) => {
                if (value) {
                    let val = String(value); // sometimes YAML config parameters are numbers
                    for (const column of Object.keys(row)) {
                        val = val.replace(new RegExp(`{{${column}}}`, "g"), row[column]);
                    }
                    const matches = val.match(/\{\{.*?\}\}/g);
                    if (matches) {
                        for (const match of matches) {
                            log.warn(`No key in .csv matches '${match}' - but might be using TradingView token-replacement`);
                        }
                    }
                    return val;
                }
                else {
                    return null;
                }
            };
            if (isBlacklisted(row.symbol)) {
                log.warn(`Not adding blacklisted symbol: `, kleur.yellow(row.symbol));
                continue;
            }
            const replacedIntervals = makeReplacements(config.tradingview?.interval);
            const parsedIntervals = replacedIntervals.toString().split(",") || ["none"];
            for (const currentInterval of parsedIntervals) {
                log.info(`Adding symbol: ${kleur.magenta(row.symbol)} | Instrument: ${kleur.magenta(row.instrument || row.base)} Quote Asset: ${kleur.magenta(row.quote_asset || row.quote)}`);
                if (currentInterval !== "none") {
                    await configureInterval(currentInterval.trim(), page);
                    await waitForTimeout(3, "after changing the interval");
                }
                await waitForTimeout(2, "let things settle from processing last alert");
                await navigateToSymbol(page, row.symbol);
                await waitForTimeout(3, "after navigating to ticker");
                await checkForInvalidSymbol(page, row.symbol);
                const singleAlertSettings = {
                    name: makeReplacements(row.alert_name || row.name || alertConfig.name),
                    message: makeReplacements(alertConfig.message)?.trimRight(),
                    condition: {
                        primaryLeft: makeReplacements(alertConfig.condition.primaryLeft),
                        primaryRight: makeReplacements(alertConfig.condition.primaryRight),
                        secondary: makeReplacements(alertConfig.condition.secondary),
                        tertiaryLeft: makeReplacements(alertConfig.condition.tertiaryLeft),
                        tertiaryRight: makeReplacements(alertConfig.condition.tertiaryRight),
                        quaternaryLeft: makeReplacements(alertConfig.condition.quaternaryLeft),
                        quaternaryRight: makeReplacements(alertConfig.condition.quaternaryRight),
                    },
                    option: makeReplacements(alertConfig.option),
                    expireInterval: alertConfig.expireInterval,
                    expireOpenEnded: alertConfig.expireOpenEnded
                };
                if (alertConfig.actions) {
                    singleAlertSettings.actions = {
                        notifyOnApp: alertConfig.actions.notifyOnApp,
                        showPopup: alertConfig.actions.showPopup,
                        sendEmail: alertConfig.actions.sendEmail,
                    };
                    if (alertConfig.actions.webhook) {
                        singleAlertSettings.actions.webhook = {
                            enabled: alertConfig.actions.webhook.enabled,
                            url: makeReplacements(alertConfig.actions.webhook.url)
                        };
                    }
                    if (alertConfig.actions.playSound) {
                        singleAlertSettings.actions.playSound = {
                            enabled: alertConfig.actions.playSound.enabled,
                            name: alertConfig.actions.playSound.name,
                            duration: alertConfig.actions.playSound.duration
                        };
                    }
                }
                await page.addStyleTag({ content: styleOverride });
                await addAlert(page, singleAlertSettings);
            }
        }
        catch (e) {
            log.error(e.message);
            if (e instanceof InvalidSymbolError) {
                e.symbol = row.symbol;
                await browser.close();
                throw e;
            }
        }
    }
    await waitForTimeout(5, "waiting a little before closing");
    await browser.close();
};
//# sourceMappingURL=add-alerts.js.map