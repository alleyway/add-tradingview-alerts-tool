import {ISingleAlertSettings} from "./interfaces";

const debug = Boolean(process.env.DEBUG)
const screenshot = Boolean(process.env.SCREENSHOT)

const [SHORT, MED, LONG] = [
    Number(process.env.DELAY_SHORT) || 300,
    Number(process.env.DELAY_MEDIUM) || 500,
    Number(process.env.DELAY_LONG) || 1000
]

export const fetchFirstXPath = async (page, selector: string, timeout = 20000) => {
    if (debug) {
        console.warn(`selector: ${selector}`)
    }
    await page.waitForXPath(selector, {timeout})
    const elements = await page.$x(selector)
    return elements[0]
}


export const takeScreenshot = async (page, name: string) => {
    if (screenshot) {
        const screenshotPath = `screenshots/screenshot_${new Date().getTime()}_${name}.png`
        await page.screenshot({
            path: screenshotPath,
        });
    }
}


export const configureInterval = async (interval: string, page) => {
    await page.waitForTimeout(SHORT);
    await page.keyboard.press(",")
    await page.waitForTimeout(MED);
    try {
        interval.split("").filter((val) => val !== "m").map((char) => page.keyboard.press(char))
    } catch (e) {
        throw Error("configuration: interval specified incorrectly, should be something like '5m' or '1h' - see documentation")
    }
    await page.waitForTimeout(MED);
    await page.keyboard.press('Enter')
    await page.waitForTimeout(LONG);
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


const alertActionCorresponding = {
    notifyOnApp: "send-push",
    showPopup: "show-popup",
    sendEmail: "send-email",
    webhook: "webhook-toggle",
}


const clickInputAndDelete = async (page, inputElement) => {
    await inputElement.click({clickCount: 1})
    await page.waitForTimeout(SHORT);
    await inputElement.click({clickCount: 3})
    await page.waitForTimeout(SHORT);
    await inputElement.press('Backspace');
    await page.waitForTimeout(SHORT);
}


export const login = async (page, username, pass) => {

    try {
        const emailSignInButton = await fetchFirstXPath(page, `//span[contains(@class, 'tv-signin-dialog__toggle-email')]`, 5000)
        emailSignInButton.click()
        await page.waitForTimeout(LONG);
    } catch (e) {

        console.warn("no email toggle button showing!")
    }

    const usernameInput = await fetchFirstXPath(page, '//input[@name=\'username\']')
    await usernameInput.type(`${username}`)
    await page.waitForTimeout(SHORT);
    const passwordInput = await fetchFirstXPath(page, '//input[@name=\'password\']')

    await Promise.all([
        passwordInput.type(`${pass}${String.fromCharCode(13)}`),
        page.waitForNavigation()
    ])


}

export const logout = async (page) => {

    await page.evaluate(() => {

        fetch("/accounts/logout/", {
            method: "POST",
            headers: {accept: "html"},
            credentials: "same-origin"
        }).then(res => {
            console.log("Request complete! response:", res);

        });
    })

    page.on('dialog', async dialog => {
        console.log(dialog.message());
        await dialog.accept();
    });

    await page.reload({
        waitUntil: 'networkidle2'
    });
}

export const navigateToSymbol = async (page, symbol: string) => {

    const symbolHeaderInput = await fetchFirstXPath(page, '//div[@id="header-toolbar-symbol-search"]')
    await symbolHeaderInput.click()
    await page.waitForTimeout(LONG);
    const symbolInput = await fetchFirstXPath(page, '//input[@data-role=\'search\']')
    await symbolInput.type(`  ${symbol}${String.fromCharCode(13)}`)
}


export const configureSingleAlertSettings = async (page, singleAlertSettings: ISingleAlertSettings) => {

    const {condition, name, option, message, actions} = singleAlertSettings

    await takeScreenshot(page, "alert_begin_configure")

    const selectFromDropDown = async (conditionToMatch) => {

        const selector = "//span[@class='tv-control-select__dropdown tv-dropdown-behavior__body i-opened']//span[@class='tv-control-select__option-wrap']";
        const elements = await page.$x(selector)
        for (const el of elements) {
            const optionText = await page.evaluate(element => element.innerText, el);
            if (optionText.indexOf(conditionToMatch) > -1) {
                if (debug) {
                    console.debug(" - selecting: ", optionText)
                }
                el.click()
                break;
            }
        }

    }

    for (const [key, xpathQuery] of Object.entries(xpathQueries)) {
        if (debug) console.debug(`key: (${key}) of xpathQueries `)

        const conditionToMatch = condition[key];
        // console.log("selecting: ", conditionToMatch)
        await page.waitForTimeout(LONG);
        if (!!conditionToMatch) {
            let isDropdown = true
            try {
                const targetElement = await fetchFirstXPath(page, xpathQuery, 3000)
                if (debug) console.debug("Clicking: ", key)
                targetElement.click()

            } catch (TimeoutError) {
                //console.error(e)
                isDropdown = false
            }
            if (isDropdown) {
                await page.waitForTimeout(LONG);
                await selectFromDropDown(conditionToMatch)
            } else {

                //console.log("clicking on input")
                const valueInput = await fetchFirstXPath(page, inputXpathQueries[key], 3000)
                await clickInputAndDelete(page, valueInput)
                await valueInput.type(String(conditionToMatch))

            }

        }
    }

    await page.waitForTimeout(SHORT);

    if (!!option) {
        const optionButton = await fetchFirstXPath(page, `//*[text()='${option}']`)
        optionButton.click()
        await page.waitForTimeout(SHORT);
    }

    // alert actions

    for (const [configKey, elementInputName] of Object.entries(alertActionCorresponding)) {

        if (!!actions && !!actions[configKey] !== undefined) {
            await page.waitForTimeout(SHORT)
            const el = await fetchFirstXPath(page, `//div[contains(@class, 'tv-dialog')]//input[@name='${elementInputName}']`)
            const isChecked = await page.evaluate(element => element.checked, el)

            if (configKey === "webhook") {
                if (isChecked != actions.webhook.enabled) {
                    el.click()
                    await page.waitForTimeout(SHORT)
                }
                if (actions.webhook.enabled && actions.webhook.url) {
                    const webhookUrlEl = await fetchFirstXPath(page, `//div[contains(@class, 'tv-dialog')]//input[@name='webhook-url']`, 1000)

                    await clickInputAndDelete(page, webhookUrlEl)
                    await webhookUrlEl.type(String(actions.webhook.url))
                }


            } else {
                if (isChecked != actions[configKey]) {
                    el.click()
                }
            }
        }

    }


    if (!!name) {
        const nameInput = await fetchFirstXPath(page, "//input[@name='alert-name']")
        await clickInputAndDelete(page, nameInput)
        await nameInput.type(name)
        await page.waitForTimeout(MED);
    }


    if (!!message) {
        const messageTextarea = await fetchFirstXPath(page, "//textarea[@class='tv-control-textarea']")
        await clickInputAndDelete(page, messageTextarea)
        await messageTextarea.type(message)
    }


}

export const clickSubmit = async (page) => {
    const submitButton = await fetchFirstXPath(page, `//div[contains(@class, 'tv-dialog')]/*/div[@data-name='submit']`)
    submitButton.click()
}

// sometimes there's a warning of "this alert may trigger differently than expected"
export const clickContinueIfWarning = async (page) => {
    try {
        const continueAnywayButton = await fetchFirstXPath(page, `//div[@data-name='warning-modal']/*//button[@name='ok-button']`,
            3000)
        continueAnywayButton.click()
        await page.waitForTimeout(3000);
    } catch (error) {
        console.debug("No warning dialog")
    }
}


export const addAlert = async (page, singleAlertSettings: ISingleAlertSettings) => {

    await page.keyboard.down('AltLeft')
    await page.keyboard.press("a")
    await page.keyboard.up('AltLeft')

    await configureSingleAlertSettings(page, singleAlertSettings)

    await page.waitForTimeout(LONG);

    await clickSubmit(page)

    await page.waitForTimeout(2000);

    await clickContinueIfWarning(page)

}

