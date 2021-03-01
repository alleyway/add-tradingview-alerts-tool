import {delay} from "./util.js";


const fetchFirstXPath = async (selector: string, page, timeout = 20000) => {
    //console.warn(`selector: ${selector}`)
    await page.waitForXPath(selector, {timeout})
    const elements = await page.$x(selector)
    return elements[0]
}

export const configureInterval = async (interval: string, page) => {
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
    tertiaryLeft: "//div[contains(@class, 'tv-alert-dialog__group-item--left ')]//input[contains(@class, 'tv-alert-dialog__number-input')]",
    tertiaryRight: "//div[contains(@class, 'tv-alert-dialog__group-item--right ')]//input[contains(@class, 'tv-alert-dialog__number-input')]"
}

export const addAlert = async (symbol: string, quote: string, base: string, rowName: string, alertConfig: any, page) => {


    const {condition, option, message} = alertConfig

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
                const targetElement = await fetchFirstXPath(xpathQuery, page, 3000)
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
                const valueInput = await fetchFirstXPath(inputXpathQueries[key], page, 3000)
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

