import * as csv from 'fast-csv';
import fs, { accessSync } from "fs";
import puppeteer from "puppeteer";
import YAML from "yaml";
import { configureInterval, addAlert, waitForTimeout, isEnvEnabled } from "./index";
import { navigateToSymbol, login, minimizeFooterChartPanel } from "./service/tv-page-actions";
import log, { logLogInfo } from "./service/log";
import kleur from "kleur";
import { logBaseDelay } from "./service/common-service";
import path from "path";
import { mkdir } from "fs/promises";
const readFilePromise = (filename) => {
    return new Promise((resolve, reject) => {
        const rows = [];
        try {
            const readStream = fs.createReadStream(filename);
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
    if (!fs.existsSync(configFileName)) {
        log.error(`Unable to find config file: ${configFileName}`);
        process.exit(1);
    }
    log.info("Using config file: ", kleur.yellow(configFileName));
    log.info("Press Ctrl-C to stop this script");
    const configString = await fs.readFileSync(configFileName, { encoding: "utf-8" });
    const config = YAML.parse(configString);
    if (config.tradingview.chartUrl === "https://www.tradingview.com/chart/XXXXXXXX/") {
        log.fatal("oops! Looks like you need to set your chartUrl in the config file!");
        process.exit(1);
    }
    let blackListRows = [];
    if (config.files.exclude) {
        try {
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
        log.trace(`${kleur.gray("Reading input file: ")}${kleur.cyan(config.files.input)}`);
        symbolRows = await readFilePromise(config.files.input);
    }
    catch (e) {
        log.fatal(`Unable to open file specified in config: ${config.files.input}`);
        process.exit(1);
    }
    const firstRow = symbolRows[0];
    if (!firstRow.symbol || !firstRow.base || !firstRow.quote) {
        log.error(`Invalid input csv file format, first line should have at least the following headers(no spaces!): ${kleur.blue("symbol,base,quote")}`);
        process.exit(1);
    }
    const { alert: alertConfig } = config;
    const userDataDir = path.join(process.cwd(), "user_data"); // where chrome will store it's stuff
    try {
        accessSync(userDataDir, fs.constants.W_OK);
    }
    catch {
        log.info(`Attempting to create directory for Chrome user data\n ${kleur.yellow(userDataDir)}`);
        await mkdir(userDataDir);
    }
    const browser = await puppeteer.launch({
        headless: headless, userDataDir,
        defaultViewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
        args: ['--no-sandbox',
            '--disable-setuid-sandbox',
            headless ? "--headless" : "",
            headless ? "" : `--app=${config.tradingview.chartUrl}#signin`,
            '--window-size=1920,1080' // otherwise headless doesn't work
        ]
    });
    let page;
    let accessDenied;
    if (headless) {
        page = await browser.newPage();
        log.trace(`Go to ${config.tradingview.chartUrl} and wait until networkidle2`);
        const pageResponse = await page.goto(config.tradingview.chartUrl + "#signin", {
            waitUntil: 'networkidle2'
        });
        accessDenied = pageResponse.status() === 403;
    }
    else {
        page = (await browser.pages())[0];
        await waitForTimeout(5, "let page load and see if access is denied");
        /* istanbul ignore next */
        accessDenied = await page.evaluate(() => {
            return document.title.includes("Denied");
        });
    }
    if (accessDenied) {
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
    const parsedIntervals = config.tradingview?.interval?.toString().split(",") || ["none"];
    for (const row of symbolRows) {
        if (isBlacklisted(row.symbol)) {
            log.warn(`Not adding blacklisted symbol: `, kleur.yellow(row.symbol));
            continue;
        }
        for (const currentInterval of parsedIntervals) {
            log.info(`Adding symbol: ${kleur.magenta(row.symbol)} | Base Asset: ${kleur.magenta(row.base)} Quote Asset: ${kleur.magenta(row.quote)}`);
            if (currentInterval !== "none") {
                await configureInterval(currentInterval.trim(), page);
                await waitForTimeout(3, "after changing the interval");
            }
            await waitForTimeout(2, "let things settle from processing last alert");
            await navigateToSymbol(page, row.symbol);
            await waitForTimeout(2, "after navigating to ticker");
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
            const singleAlertSettings = {
                name: makeReplacements(row.name || alertConfig.name),
                message: makeReplacements(alertConfig.message),
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
            }
            await addAlert(page, singleAlertSettings);
        }
    }
    await waitForTimeout(3);
    await browser.close();
};
//# sourceMappingURL=add-alerts.js.map