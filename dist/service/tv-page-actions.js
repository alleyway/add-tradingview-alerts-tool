import { waitForTimeout, isEnvEnabled } from "./common-service.js";
import log from "./log.js";
import kleur from "kleur";
import { NoInputFoundError } from "../classes.js";
import RegexParser from "regex-parser";
// data-dialog-name="gopro"
const screenshot = isEnvEnabled(process.env.SCREENSHOT);
export const fetchFirstXPath = async (page, selector, timeout = 20000) => {
    log.trace(kleur.gray(`...selector: ${kleur.yellow(selector)}`));
    try {
        await page.waitForXPath(selector, { timeout });
    }
    catch (e) {
        await takeScreenshot(page, "waitForXPathFailed");
        throw (e);
    }
    const elements = await page.$x(selector);
    return elements[0];
};
export const takeScreenshot = async (page, name = "unnamed") => {
    if (screenshot) {
        const screenshotPath = `screenshot_${new Date().getTime()}_${name}.png`;
        log.trace(`saving screenshot: ${screenshotPath}`);
        await page.screenshot({
            path: screenshotPath,
        });
    }
};
export const configureInterval = async (interval, page) => {
    log.trace(`set ${kleur.blue("interval")}: ${kleur.yellow(interval)}`);
    await page.keyboard.press(",");
    await waitForTimeout(.5, "after pressing interval shortcut key");
    try {
        interval.split("").filter((val) => val !== "m").map((char) => page.keyboard.press(char));
    }
    catch (e) {
        throw Error("configuration: interval specified incorrectly, should be something like '5m' or '1h' - see documentation");
    }
    await page.keyboard.press('Enter');
};
// queries used on the alert conditions
const dropdownXpathQueries = {
    primaryLeft: "//div[contains(@class, 'tv-alert-dialog__group-item--left ')]/span[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small']/span[@class='tv-control-select__control tv-dropdown-behavior__button']",
    primaryRight: "//div[contains(@class, 'tv-alert-dialog__group-item--right ')]/span[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small']/span[@class='tv-control-select__control tv-dropdown-behavior__button']",
    secondary: "//*[contains(@class,'tv-control-fieldset__value tv-alert-dialog__fieldset-value js-condition-operator-input-wrap')]/*[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small']/span[@class='tv-control-select__control tv-dropdown-behavior__button']",
    tertiaryLeft: "(//div[contains(@class, 'tv-alert-dialog__group-item--left ') and contains(@class, 'js-second-operand-')]/span[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/span[@class='tv-control-select__control tv-dropdown-behavior__button'])[1]",
    quaternaryLeft: "(//div[contains(@class, 'tv-alert-dialog__group-item--left ') and contains(@class, 'js-second-operand-')]/span[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/span[@class='tv-control-select__control tv-dropdown-behavior__button'])[2]",
    tertiaryRight: "(//div[contains(@class, 'tv-alert-dialog__group-item--right ') and contains(@class, 'js-second-operand-')]/span[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/span[@class='tv-control-select__control tv-dropdown-behavior__button'])[1]",
    quaternaryRight: "(//div[contains(@class, 'tv-alert-dialog__group-item--right ') and contains(@class, 'js-second-operand-')]/span[@class='tv-control-select__wrap tv-dropdown-behavior tv-control-select--size_small' and 1]/span[@class='tv-control-select__control tv-dropdown-behavior__button'])[2]",
};
const inputXpathQueries = {
    tertiaryLeft: "(//div[contains(@class, 'tv-alert-dialog__group-item--left ')]/div[contains(@class, 'js-number-input')]/input)[1]",
    tertiaryRight: "(//div[contains(@class, 'tv-alert-dialog__group-item--right ')]/div[contains(@class, 'js-number-input')]/input)[1]",
    quaternaryLeft: "(//div[contains(@class, 'tv-alert-dialog__group-item--left ')]/div[contains(@class, 'js-number-input')]/input)[2]",
    quaternaryRight: "(//div[contains(@class, 'tv-alert-dialog__group-item--right ')]/div[contains(@class, 'js-number-input')]/input)[2]",
};
const alertActionCorresponding = {
    notifyOnApp: "send-push",
    showPopup: "show-popup",
    sendEmail: "send-email",
    webhook: "webhook-toggle",
};
const clickInputAndDelete = async (page, inputElement) => {
    await page.evaluate((el) => el.value = "", inputElement);
    // await inputElement.click({clickCount: 1})
    // await waitForTimeout(.2);
    // await inputElement.click({clickCount: 3})
    // await waitForTimeout(.2);
    // await inputElement.press('Backspace');
    // await waitForTimeout(.2);
};
export const login = async (page, username, pass) => {
    try {
        const emailSignInButton = await fetchFirstXPath(page, `//span[contains(@class, 'tv-signin-dialog__toggle-email')]`, 5000);
        emailSignInButton.click();
        await waitForTimeout(1);
    }
    catch (e) {
        log.warn("no email toggle button showing!");
    }
    const usernameInput = await fetchFirstXPath(page, '//input[@name=\'username\']');
    await usernameInput.type(`${username}`);
    await waitForTimeout(.5);
    await takeScreenshot(page, "shouldbe_before_password_entry");
    const passwordInput = await fetchFirstXPath(page, '//input[@name=\'password\']');
    log.trace("typing password");
    await passwordInput.type(pass);
    const submitButton = await fetchFirstXPath(page, '//button[@type=\'submit\']');
    log.trace("clicking submit button");
    submitButton.click();
    await page.waitForNavigation();
};
export const logout = async (page) => {
    await page.evaluate(() => {
        fetch("/accounts/logout/", {
            method: "POST",
            headers: { accept: "html" },
            credentials: "same-origin"
        }).then(res => {
            log.info(`Logged out of TradingView`);
        });
    });
    page.on('dialog', async (dialog) => {
        await dialog.accept();
    });
    await page.reload({
        waitUntil: 'networkidle2'
    });
};
export const navigateToSymbol = async (page, symbol) => {
    const symbolHeaderInput = await fetchFirstXPath(page, '//div[@id="header-toolbar-symbol-search"]');
    await symbolHeaderInput.click();
    await waitForTimeout(1);
    const symbolInput = await fetchFirstXPath(page, '//input[@data-role=\'search\']');
    await symbolInput.type(`  ${symbol}${String.fromCharCode(13)}`);
};
const isMatch = (needle, haystack) => {
    if (needle.startsWith("/")) {
        log.trace(`Parsing what appears to be regular expression: ${kleur.yellow(needle)} ... Haystack: ${kleur.gray(haystack)}`);
        const regexp = RegexParser(needle);
        return !!regexp.exec(haystack);
    }
    else {
        return haystack.indexOf(needle) > -1;
    }
};
export const configureSingleAlertSettings = async (page, singleAlertSettings) => {
    const { condition, name, option, message, actions } = singleAlertSettings;
    await takeScreenshot(page, "alert_begin_configure");
    const selectFromDropDown = async (conditionToMatch) => {
        log.trace(`searching menu for ${kleur.yellow(conditionToMatch)}`);
        const selector = "//span[@class='tv-control-select__dropdown tv-dropdown-behavior__body i-opened']//span[@class='tv-control-select__option-wrap']";
        const elements = await page.$x(selector);
        let found = false;
        for (const el of elements) {
            const optionText = await page.evaluate(element => element.innerText, el);
            if (isMatch(conditionToMatch, optionText)) {
                log.trace(`Found! Clicking ${kleur.yellow(optionText)}`);
                found = true;
                el.click();
                break;
            }
        }
        if (!found)
            throw Error(`Unable to partial match ${conditionToMatch} in dropdown`);
    };
    const performActualEntry = async (key) => {
        const conditionOrInputValue = String(condition[key]);
        log.trace(`Processing ${kleur.blue(key)}: ${kleur.yellow(conditionOrInputValue)}`);
        await waitForTimeout(.7);
        if (conditionOrInputValue !== "null" && String(conditionOrInputValue).length > 0) {
            try {
                log.trace(`Searching potential dropdown xpath of ${kleur.yellow(key)}`);
                const targetElement = await fetchFirstXPath(page, dropdownXpathQueries[key], 3000);
                // must be a dropdown...
                log.trace(`Found dropdown! Clicking element of ${kleur.yellow(key)}`);
                targetElement.click();
                await waitForTimeout(.5, "let dropdown populate");
                await selectFromDropDown(conditionOrInputValue);
                await waitForTimeout(.5, "let dropdown populate");
            }
            catch (e) {
                if (e.constructor.name === "TimeoutError") {
                    if (inputXpathQueries[key]) {
                        log.trace("Timed out. Maybe it's not a dropdown. Search for 'input' xpath query");
                        const valueInput = await fetchFirstXPath(page, inputXpathQueries[key], 3000);
                        log.trace(`Typing value: ${kleur.blue(conditionOrInputValue)}`);
                        await clickInputAndDelete(page, valueInput);
                        await valueInput.type(String(conditionOrInputValue));
                    }
                    else {
                        throw (new NoInputFoundError("Unable to find Xpath target for primaryLeft/secondary which doesn't have inputs, so won't even try"));
                    }
                }
                else {
                    throw e;
                }
            }
        }
    };
    await performActualEntry("primaryLeft");
    try {
        await performActualEntry("primaryRight");
        await performActualEntry("secondary");
    }
    catch (e) {
        if (e instanceof NoInputFoundError) {
            log.trace("NoInputFoundError, maybe we need to send secondary before setting primaryRight");
            // sometimes the secondary must be set first before the primaryRight shows up
            await performActualEntry("secondary");
            await performActualEntry("primaryRight");
        }
        else {
            throw e;
        }
    }
    await performActualEntry("tertiaryLeft");
    await performActualEntry("tertiaryRight");
    await performActualEntry("quaternaryLeft");
    await performActualEntry("quaternaryRight");
    await waitForTimeout(.5);
    if (!!option) {
        log.trace(`Selecting option: ${kleur.blue(option)}`);
        const optionButton = await fetchFirstXPath(page, `//*[text()='${option}']`);
        optionButton.click();
        await waitForTimeout(.3);
    }
    // alert actions
    for (const [configKey, elementInputName] of Object.entries(alertActionCorresponding)) {
        if (!!actions && !!actions[configKey] !== undefined) {
            await waitForTimeout(.3);
            const el = await fetchFirstXPath(page, `//div[contains(@class, 'tv-dialog')]//input[@name='${elementInputName}']`);
            const isChecked = await page.evaluate(element => element.checked, el);
            if (configKey === "webhook") {
                if (isChecked != actions.webhook.enabled) {
                    log.trace(`setting ${kleur.blue("webhook")} as checked`);
                    el.click();
                    await waitForTimeout(.3);
                }
                if (actions.webhook.enabled && actions.webhook.url) {
                    await waitForTimeout(.3);
                    log.trace(`typing webhook url: ${kleur.blue(actions.webhook.url)}`);
                    const webhookUrlEl = await fetchFirstXPath(page, `//div[contains(@class, 'tv-dialog')]//input[@name='webhook-url']`, 1000);
                    await clickInputAndDelete(page, webhookUrlEl);
                    await webhookUrlEl.type(String(actions.webhook.url));
                }
            }
            else {
                if (isChecked != actions[configKey]) {
                    log.trace(`setting ${kleur.blue(configKey)} as checked`);
                    el.click();
                }
            }
        }
    }
    if (!!name) {
        log.trace(`Setting Alert Name: ${kleur.blue(name)}`);
        const nameInput = await fetchFirstXPath(page, "//input[@name='alert-name']");
        await clickInputAndDelete(page, nameInput);
        await nameInput.type(name);
        await waitForTimeout(.5);
    }
    if (!!message) {
        log.trace(`Setting message: ${kleur.blue(message)}`);
        const messageTextarea = await fetchFirstXPath(page, "//textarea[@class='tv-control-textarea']");
        await clickInputAndDelete(page, messageTextarea);
        await messageTextarea.type(message);
    }
};
export const clickSubmit = async (page) => {
    log.trace("clickSubmit()");
    const submitButton = await fetchFirstXPath(page, `//div[contains(@class, 'tv-dialog')]/*/div[@data-name='submit']`);
    submitButton.click();
};
// sometimes there's a warning of "this alert may trigger differently than expected"
export const clickContinueIfWarning = async (page) => {
    try {
        log.trace("clickContinueIfWarning()");
        const continueAnywayButton = await fetchFirstXPath(page, `//button[@name='continue']`, 3000);
        continueAnywayButton.click();
        await waitForTimeout(3, "waiting after clicking 'continue anyway' button");
    }
    catch (error) {
        log.trace("No warning dialog");
    }
};
export const addAlert = async (page, singleAlertSettings) => {
    log.trace("addAlert()...pressing shortcut key");
    await page.keyboard.down('AltLeft');
    await page.keyboard.press("a");
    await page.keyboard.up('AltLeft');
    await waitForTimeout(1, "after clicking shortcut for new alert dialog");
    await configureSingleAlertSettings(page, singleAlertSettings);
    await waitForTimeout(.5);
    await clickSubmit(page);
    await waitForTimeout(2);
    await clickContinueIfWarning(page);
};
//# sourceMappingURL=tv-page-actions.js.map