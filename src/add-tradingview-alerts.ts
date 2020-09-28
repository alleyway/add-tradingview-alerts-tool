import 'source-map-support/register'
import csv from 'csv-parser'
import fs from "fs"
import puppeteer from "puppeteer"
import YAML from "yaml"

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
            })
    })
}

const fetchFirstXPath = async (selector: string, page) => {
    //console.warn(`selector: ${selector}`)
    await page.waitForXPath(selector)
    const elements = await page.$x(selector)
    return elements[0]
}

// made using XPath Generator 1.1.0

const addAlert = async (symbol: string, quote: string, base: string, alertConfig: any, page) => {


    const {indicator, signal, option, message} = alertConfig

    //await page.waitForXPath('//*[@id="header-toolbar-symbol-search"]/div/input')


    const symbolHeaderInput = await fetchFirstXPath('//*[@id="header-toolbar-symbol-search"]/div/input', page)

    await symbolHeaderInput.click()
    await delay(1000);
    const symbolInput = await fetchFirstXPath('//input[@data-role=\'search\']', page)
    await symbolInput.type(`  ${symbol}${String.fromCharCode(13)}`)

    await delay(9000);

    const alertButton = await fetchFirstXPath('//*[@id="header-toolbar-alerts"]', page)

    await alertButton.click()


    await delay(5000);
    const conditionDropDown = await fetchFirstXPath("//*[@class='tv-alert-dialog__group-item tv-alert-dialog__group-item--left js-main-series-select-wrap']/*[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/*[@class='tv-control-select__control tv-dropdown-behavior__button' and 1]", page)

    conditionDropDown.click()
    await delay(1000);

    const optionMTF = await fetchFirstXPath(`//*[@class='tv-control-select__option-wrap' and contains(text(), '${indicator}')]`, page)
    optionMTF.click()

    await delay(1000);

    const signalDropDown = await fetchFirstXPath("//*[@class='tv-control-fieldset__value tv-alert-dialog__fieldset-value js-condition-operator-input-wrap']/span[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/span[@class='tv-control-select__control tv-dropdown-behavior__button' and 1]", page)
    signalDropDown.click()

    await delay(1000);
    const optionSignal = await fetchFirstXPath(`//*[@class='tv-control-select__option-wrap' and contains(text(), '${signal}')]`, page)
    optionSignal.click()

    await delay(1000);
    const freqButton = await fetchFirstXPath(`//*[text()='${option}']`, page)
    freqButton.click()

    await delay(1000);

    //await page.evaluate("textarea[name=description]", el => el.value = "")

    const messageTextarea = await fetchFirstXPath("//textarea[@class='tv-control-textarea']", page)

    messageTextarea.click({clickCount: 3})

    await delay(500);
    await messageTextarea.press('Backspace');
    await delay(500);

    const messageText = message.toString().replace(/\{\{quote}}/g, quote).replace().replace(/\{\{base}}/g, base).replace()

    await messageTextarea.type(messageText)

    await delay(1000);
    const continueButton = await fetchFirstXPath("//span[@class='tv-button__loader']", page)
    continueButton.click()

    await delay(1500);

    const continueAnywayButton = await fetchFirstXPath("//*[text()='Continue anyway']", page)
    continueAnywayButton.click()

    await delay(5000);

}


const main = async () => {

    const configString = await fs.readFileSync("./config.yml", {encoding: "utf-8"})

    const config = YAML.parse(configString)

    const {alert: alertConfig} = config

    //console.log("alertConfig", alertConfig.message)

    const browser = await puppeteer.launch({
        headless: false, userDataDir: "./user_data",
        args: [
            `--app=${"about:blank"}`
        ]
    })
    const page = await browser.newPage()

    await page.setViewport({width: 1440, height: 671})

    const response = await page.goto(config.tradingview.chartUrl + "#signin")

    if (response.status() == 403) {

        console.log("You'll need to sign into TradingView in this browser (one time only)")
        await delay(1000000)

    } else {
        await delay(3000)

        const blackListRows = await readFilePromise(config.files.exclude)

        const isBlacklisted = (symbol:string) => {
            for (const row of blackListRows) {
                if (symbol.toLowerCase().includes(row.symbol.toLowerCase())){
                    return true
                }
            }
            return false
        }

        const symbolRows = await readFilePromise(config.files.input)

        for (const row of symbolRows) {

            if (isBlacklisted(row.symbol)) {
                console.warn(`Not adding blacklisted symbol: `, row.symbol)
                continue
            }

            console.log(`Adding symbol: ${row.symbol}  ( ${row.base} priced in ${row.quote} )`)
            await delay(5000)
            await addAlert(row.symbol, row.quote, row.base, alertConfig, page)
        }
    }


    await browser.close()

}


main().catch(error => console.error(error))
