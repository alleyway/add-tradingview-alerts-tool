import csv from 'csv-parser'
import fs from "fs"
import puppeteer from "puppeteer"
import YAML from "yaml"
import {configureInterval, addAlert} from "./index";
import {navigateToSymbol, login} from "./service/tv-page-actions";
import {ISingleAlertSettings} from "./interfaces";
import log from "./service/log"
import kleur from "kleur";
import {waitForTimeout} from "./index";

const readFilePromise = (filename: string) => {
    return new Promise<any>((resolve, reject) => {
        const results = []

        fs.createReadStream(filename)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results)
            }).on('error', () => {
            reject("Unable to read csv")
        })
    })
}

const main = async () => {

    const headless = false

    const configFileName = process.argv[2] || "config.yml"

    if (!fs.existsSync(configFileName)) {
        log.error(`Unable to find config file: ${configFileName}`)
        process.exit(1)
    }

    log.info("Using config file: ", kleur.yellow(configFileName))

    log.info("Press Ctrl-C to stop this script")

    const configString = await fs.readFileSync(configFileName, {encoding: "utf-8"})

    const config = YAML.parse(configString)

    const {alert: alertConfig} = config

    const browser = await puppeteer.launch({
        headless: headless, userDataDir: "./user_data",
        defaultViewport: null,

        args: headless ? null : [
            `--app=${config.tradingview.chartUrl}#signin`,
            // '--window-size=1440,670'
        ]
    })

    let page
    let accessDenied;

    if (headless) {
        page = await browser.newPage();

        log.trace(`Go to ${config.tradingview.chartUrl} and wait until networkidle2`)
        const pageResponse = await page.goto(config.tradingview.chartUrl + "#signin", {
            waitUntil: 'networkidle2'
        });


        accessDenied = pageResponse.status() === 403

    } else {
        page = (await browser.pages())[0];
        await waitForTimeout(5, "let page load and see if access is denied")
        accessDenied = await page.evaluate(() => {
            return document.title.includes("Denied");
        });
    }

    if (accessDenied) {

        if (config.tradingview.username && config.tradingview.password) {

            await login(page, config.tradingview.username, config.tradingview.password)

        } else {
            log.warn("You'll need to sign into TradingView in this browser (one time only)\n...after signing in, press ctrl-c to kill this script, then run it again")
            await waitForTimeout(1000000)
            await browser.close()
            process.exit(1)
        }


    }

    await waitForTimeout(3, "wait a little longer for page to load")

    const blackListRows = config.files.exclude ? await readFilePromise(config.files.exclude) : []

    const isBlacklisted = (symbol: string) => {
        for (const row of blackListRows) {
            if (symbol.toLowerCase().includes(row.symbol.toLowerCase())) {
                return true
            }
        }
        return false
    }

    if (config.tradingview.interval) {
        await configureInterval(config.tradingview.interval, page)
        await waitForTimeout(3, "after changing the interval")
    }

    const symbolRows = await readFilePromise(config.files.input)

    for (const row of symbolRows) {

        if (isBlacklisted(row.symbol)) {
            log.warn(`Not adding blacklisted symbol: `, kleur.yellow(row.symbol))
            continue
        }

        log.info(`Adding symbol: ${kleur.magenta(row.symbol)}  ( ${row.base} priced in ${row.quote} )`)

        await waitForTimeout(2, "let things settle from processing last alert")

        await navigateToSymbol(page, row.symbol)

        await waitForTimeout(2, "after navigating to ticker")

        const message = alertConfig.message.toString().replace(/{{quote}}/g, row.quote).replace(/{{base}}/g, row.base)

        const alertName = (row.name || alertConfig.name || "").toString().replace(/{{symbol}}/g, row.symbol).replace(/{{quote}}/g, row.quote).replace().replace(/{{base}}/g, row.base).replace()

        const singleAlertSettings: ISingleAlertSettings = {
            name: alertName,
            message,
            condition: {
                primaryLeft: alertConfig.condition.primaryLeft,
                primaryRight: alertConfig.condition.primaryRight,
                secondary: alertConfig.condition.secondary,
                tertiaryLeft: alertConfig.condition.tertiaryLeft,
                tertiaryRight: alertConfig.condition.tertiaryRight,
            },
            option: alertConfig.option,
        }

        if (alertConfig.actions) {
            singleAlertSettings.actions = {
                notifyOnApp: alertConfig.actions.notifyOnApp,
                showPopup: alertConfig.actions.showPopup,
                sendEmail: alertConfig.actions.sendEmail,
            }
            if (alertConfig.actions.webhook) {
                singleAlertSettings.actions.webhook = {
                    enabled: alertConfig.actions.webhook.enabled,
                    url: alertConfig.actions.webhook.url
                }
            }

        }


        await addAlert(page, singleAlertSettings)
    }


    await waitForTimeout(3)
    await browser.close()
}


main().catch(error => {
    log.error(error)
    process.exit(1)
}).then(() => {
    process.exit(0)
})
