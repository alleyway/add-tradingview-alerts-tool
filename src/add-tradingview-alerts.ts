import csv from 'csv-parser'
import fs from "fs"
import puppeteer from "puppeteer"
import YAML from "yaml"
import {TimeoutError} from "puppeteer/lib/esm/puppeteer/common/Errors";
import {configureInterval, addAlert} from "./index.js";
import {delay} from "./util.js";

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

    const configFileName = process.argv[2] || "config.yml"

    if (!fs.exists) {
        console.error("Unable to find config file: ", configFileName)
    }

    console.log("Using config file: ", configFileName)

    console.log("Press Ctrl-C to stop this script")

    const configString = await fs.readFileSync(configFileName, {encoding: "utf-8"})

    const config = YAML.parse(configString)

    const {alert: alertConfig} = config

    //console.log("alertConfig", alertConfig.message)

    const browser = await puppeteer.launch({
        headless: true, userDataDir: "./user_data",
        defaultViewport: null,
        args: [
            // `--app=${config.tradingview.chartUrl}#signin`,
            // '--window-size=1440,670'
        ]
    })

    await delay(4000)

    const page = await browser.newPage();

    await page.goto(config.tradingview.chartUrl, {
        waitUntil: 'networkidle2'
    });

    //const page = (await browser.pages())[0];

    const isAccessDenied = await page.evaluate(() => {
        return document.title.includes("Denied");
    });

    // const page = await browser.newPage()
    // const response = await page.goto(config.tradingview.chartUrl + "#signin")

    if (isAccessDenied) {

        console.log("You'll need to sign into TradingView in this browser (one time only)\n...after signing in, press ctrl-c to kill this script, then run it again")
        await delay(1000000)

    } else {
        await delay(3000)

        const blackListRows = await readFilePromise(config.files.exclude)

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
        }


        const symbolRows = await readFilePromise(config.files.input)

        for (const row of symbolRows) {

            if (isBlacklisted(row.symbol)) {
                console.warn(`Not adding blacklisted symbol: `, row.symbol)
                continue
            }

            console.log(`Adding symbol: ${row.symbol}  ( ${row.base} priced in ${row.quote} )`)
            await delay(5000)
            await addAlert(row.symbol, row.quote, row.base, row.name, alertConfig, page)
        }
    }

    await delay(4000)
    await browser.close()

}


main().catch(error => console.error(error))
