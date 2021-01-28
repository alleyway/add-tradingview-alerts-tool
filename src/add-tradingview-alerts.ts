import 'source-map-support/register'
import csv from 'csv-parser'
import fs from "fs"
import puppeteer from "puppeteer"
import YAML from "yaml"
import {TimeoutError} from "puppeteer/lib/esm/puppeteer/common/Errors";


function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}


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

const fetchFirstXPath = async (selector: string, page, timeout = 20000) => {
    //console.warn(`selector: ${selector}`)
    await page.waitForXPath(selector, {timeout})
    const elements = await page.$x(selector)
    return elements[0]
}

// made using XPath Generator 1.1.0


const configureInterval = async (interval: string, page) => {
    await delay(1000);
    await page.keyboard.press(",")
    await delay(1000);
    try {
        interval.split("").filter((val) => val !== "m").map((char) => page.keyboard.press(char))
    } catch (e) {
        throw Error("configuration: interval specified incorrectly, should be something like '5m' or '1h' - see documentation")
    }
    await delay(1000);
    await page.keyboard.press('Enter')
    //const intervalElement = await fetchFirstXPath(`//input[@class='change-interval-input']`, page)
    //await intervalElement.type(`${interval}${String.fromCharCode(13)}`)
    await delay(5000);
}

// queries used on the alert conditions
const xpathQueries = {
    primaryLeft: "//*[@class='tv-alert-dialog__group-item tv-alert-dialog__group-item--left js-main-series-select-wrap']/*[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/*[@class='tv-control-select__control tv-dropdown-behavior__button' and 1]",
    primaryRight: "//div[@class='tv-alert-dialog__group-item tv-alert-dialog__group-item--right js-main-series-plot-index-select-wrap']/span[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/span[@class='tv-control-select__control tv-dropdown-behavior__button' and 1]",
    secondary: "//*[@class='tv-control-fieldset__value tv-alert-dialog__fieldset-value js-condition-operator-input-wrap']/*[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/span[@class='tv-control-select__control tv-dropdown-behavior__button' and 1]",
    tertiaryLeft: "//div[@class='tv-alert-dialog__group-item tv-alert-dialog__group-item--left js-second-operand-select-wrap__band-main']/span[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/span[@class='tv-control-select__control tv-dropdown-behavior__button' and 1]",
    tertiaryRight: "//div[@class='tv-alert-dialog__group-item tv-alert-dialog__group-item--right js-second-operand-value-wrap__band-main']/span[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/span[@class='tv-control-select__control tv-dropdown-behavior__button' and 1]"
}

const inputXpathQueries = {
    tertiaryLeft: "//div[@class='tv-control-number-input tv-control-number-input--size_small js-number-input__wrap js-move-value-input-wrap']/input[@class='tv-alert-dialog__number-input tv-control-input tv-control-input--size_small js-number-input' and 1]",
    tertiaryRight: "//div[@class='tv-control-number-input tv-control-number-input--size_small js-number-input__wrap js-period-input-wrap']/input[@class='tv-alert-dialog__number-input tv-control-input tv-control-input--size_small js-number-input' and 1]"
}

const addAlert = async (symbol: string, quote: string, base: string, rowName: string, alertConfig: any, page) => {


    const {condition, option, message} = alertConfig

    const {primaryLeft, primaryRight, secondary, tertiaryLeft, tertiaryRight} = condition


    const symbolHeaderInput = await fetchFirstXPath('//div[@id="header-toolbar-symbol-search"]', page)
    await symbolHeaderInput.click()
    await delay(800);
    const symbolInput = await fetchFirstXPath('//input[@data-role=\'search\']', page)
    await symbolInput.type(`  ${symbol}${String.fromCharCode(13)}`)
    await delay(8000);

    await page.keyboard.down('AltLeft')

    await page.keyboard.press("a")

    await page.keyboard.up('AltLeft')


    const selectFromDropDown = async (conditionToMatch) => {

        const selector = "//span[@class='tv-control-select__dropdown tv-dropdown-behavior__body i-opened']//span[@class='tv-control-select__option-wrap']";
        const elements = await page.$x(selector)
        for (const el of elements) {
            const optionText = await page.evaluate(element => element.innerText, el);
            if (optionText.indexOf(conditionToMatch) > -1) {
                //console.debug(" - selecting: ", optionText)
                el.click()
                break;
            }
        }

    }

    for (const [key, xpathQuery] of Object.entries(xpathQueries)) {

        const conditionToMatch = condition[key];
        // console.log("selecting: ", conditionToMatch)
        await delay(1000);
        if (!!conditionToMatch) {
            let isDropdown = true
            try {
                const targetElement = await fetchFirstXPath(xpathQuery, page, 1000)
                //console.debug("Clicking: ", key)
                targetElement.click()

            } catch (TimeoutError) {
                //console.error(e)
                isDropdown = false
            }
            if (isDropdown) {
                await delay(1500);
                await selectFromDropDown(conditionToMatch)
            } else {

                //console.log("clicking on input")
                const valueInput = await fetchFirstXPath(inputXpathQueries[key], page, 1000)
                await valueInput.click({ clickCount: 3 })
                //console.log("planning to type: ", conditionToMatch)
                await valueInput.press('Backspace');
                await valueInput.type(String(conditionToMatch))

            }

        }
    }

    await delay(400);

    if (!!option) {
        const optionButton = await fetchFirstXPath(`//*[text()='${option}']`, page)
        optionButton.click()
        await delay(400);
    }

    const alertName = (rowName || alertConfig.name || "").toString().replace(/{{symbol}}/g, symbol).replace(/{{quote}}/g, quote).replace().replace(/{{base}}/g, base).replace()

    if (!!alertName) {
        const nameInput = await fetchFirstXPath("//input[@name='alert-name']", page)
        nameInput.click()
        await nameInput.press('Backspace');
        await nameInput.type(alertName)
        await delay(800);
    }


    if (!!message) {
        const messageTextarea = await fetchFirstXPath("//textarea[@class='tv-control-textarea']", page)

        messageTextarea.click({clickCount: 3})

        await delay(500);
        await messageTextarea.press('Backspace');
        await delay(500);

        const messageText = message.toString().replace(/{{quote}}/g, quote).replace(/{{base}}/g, base)

        await messageTextarea.type(messageText)
    }


    await delay(1000);
    const continueButton = await fetchFirstXPath("//span[@class='tv-button__loader']", page)
    continueButton.click()

    await delay(2000);

    try {
        const continueAnywayButton = await fetchFirstXPath("//*[text()='Continue anyway']", page, 3000)
        continueAnywayButton.click()
        await delay(5000);
    } catch (error) {
        //must not be alert on an indicator
    }


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
        headless: false, userDataDir: "./user_data",
        defaultViewport: null,
        args: [
            `--app=${config.tradingview.chartUrl}#signin`,
            // '--window-size=1440,670'
        ]
    })

    await delay(4000)

    const page = (await browser.pages())[0];

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
