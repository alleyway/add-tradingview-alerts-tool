import { waitForTimeout, isEnvEnabled } from "./common-service";
import log from "./log";
import kleur from "kleur";
import { AddAlertInvocationError, InvalidSymbolError, NoInputFoundError, SelectionError } from "../classes";
import RegexParser from "regex-parser";
import { accessSync, constants, writeFileSync } from "fs";
import puppeteer from "puppeteer";
import path from "path";
import { mkdir } from "fs/promises";
// data-dialog-name="gopro"
const screenshot = isEnvEnabled(process.env.SCREENSHOT);
export const isXpathVisible = async (page, selector, screenShotOnFail = false) => {
    log.trace(kleur.gray(`...isXpathVisible?: ${kleur.yellow(selector)}`));
    const elements = await page.$x(selector);
    const visible = elements.length > 0;
    log.trace(`..isXpathVisible: ${visible}`);
    return visible;
};
export const fetchFirstXPath = async (page, selector, timeout = 20000, screenshotOnFail = true) => {
    log.trace(kleur.gray(`...selector: ${kleur.yellow(selector)}`));
    try {
        await page.waitForXPath(selector, { timeout });
    }
    catch (e) {
        if (screenshotOnFail)
            await takeScreenshot(page, "waitForXPathFailed");
        throw (e);
    }
    const elements = await page.$x(selector);
    return elements[0];
};
export const takeScreenshot = async (page, name = "unnamed") => {
    if (screenshot) {
        const username = await page.evaluate(() => {
            // @ts-ignore
            const user = window.user;
            if (user) {
                return "_" + user.username;
            }
            else {
                return "";
            }
        });
        const screenshotPath = `screenshot_${new Date().getTime()}${username}_${name}`;
        log.trace(`saving screenshot: ${screenshotPath}`);
        await page.screenshot({
            path: screenshotPath + ".png",
        });
        const html = await page.content();
        writeFileSync(screenshotPath + ".xml", html, { encoding: "utf-8" });
    }
};
export const minimizeFooterChartPanel = async (page) => {
    log.trace(`minimizing footer chart panel`);
    try {
        const footerPanelMinimizeButton = await fetchFirstXPath(page, `//div[@id='footer-chart-panel']//button[@data-name='toggle-visibility-button' and @data-active='false']`, 5000);
        footerPanelMinimizeButton.click();
        await waitForTimeout(.4);
    }
    catch (e) {
        log.trace("no minimize button found, footer chart panel must be hidden already");
    }
};
export const convertIntervalForTradingView = (interval) => {
    return interval.split("").filter((val) => val !== "m").join("");
};
export const configureInterval = async (interval, page) => {
    log.trace(`set ${kleur.blue("interval")}: ${kleur.yellow(interval)}`);
    await page.keyboard.press(",");
    await waitForTimeout(.5, "after pressing interval shortcut key");
    try {
        convertIntervalForTradingView(interval).split("").map((char) => page.keyboard.press(char));
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
const dropdownSoundXpathQueries = {
    name: "//div[contains(@class, 'js-sound-settings')]/div[contains(@class, 'tv-alert-dialog__group-item--left')]/*/span[@class='tv-control-select__control tv-dropdown-behavior__button']",
    duration: "//div[contains(@class, 'js-sound-settings')]/div[contains(@class, 'tv-alert-dialog__group-item--right')]/*/span[@class='tv-control-select__control tv-dropdown-behavior__button']",
};
const inputXpathQueries = {
    tertiaryLeft: "(//div[contains(@class, 'tv-alert-dialog__group-item--left ')]/div[contains(@class, 'js-number-input')]/input)[1]",
    tertiaryRight: "(//div[contains(@class, 'tv-alert-dialog__group-item--right ')]/div[contains(@class, 'js-number-input')]/input)[1]",
    quaternaryLeft: "(//div[contains(@class, 'tv-alert-dialog__group-item--left ')]/div[contains(@class, 'js-number-input')]/input)[2]",
    quaternaryRight: "(//div[contains(@class, 'tv-alert-dialog__group-item--right ')]/div[contains(@class, 'js-number-input')]/input)[2]",
};
const readOnlyInputQueries = {
    tertiaryLeft: "(//div[contains(@class, 'tv-alert-dialog__group-item--left ') and contains(@class, 'js-second-operand-')])[1]//input[@type='text']",
    quaternaryLeft: "(//div[contains(@class, 'tv-alert-dialog__group-item--left ') and contains(@class, 'js-second-operand-')])[2]//input[@type='text']"
};
const alertActionCorresponding = {
    notifyOnApp: "send-push",
    showPopup: "show-popup",
    sendEmail: "send-email",
    webhook: "webhook-toggle",
    playSound: "play-sound"
};
const clickInputAndDelete = async (page, inputElement) => {
    /* istanbul ignore next */
    await page.evaluate((el) => el.value = "", inputElement);
};
export const launchBrowser = async (headless, url) => {
    const userDataDir = path.join(process.cwd(), "user_data"); // where chrome will store it's stuff
    try {
        accessSync(userDataDir, constants.W_OK);
    }
    catch {
        log.info(`Attempting to create directory for Chrome user data\n ${kleur.yellow(userDataDir)}`);
        await mkdir(userDataDir);
    }
    return puppeteer.launch({
        headless: headless, userDataDir,
        defaultViewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
        args: ['--no-sandbox',
            '--enable-experimental-web-platform-features',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            // '--single-process', // will cause it to die
            '--disable-gpu',
            headless ? "--headless" : "",
            headless && !url ? "" : `--app=${url}`,
            '--window-size=1920,1080', // otherwise headless doesn't work
            // '--incognito'
        ]
    });
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
    const submitButton = await fetchFirstXPath(page, "//button[@type='submit' and contains(@class, 'tv-button--primary')]");
    log.trace("clicking submit button");
    submitButton.click();
    await waitForTimeout(2);
};
export const logout = async (page) => {
    /* istanbul ignore next */
    await page.evaluate(() => {
        fetch("/accounts/logout/", {
            method: "POST",
            headers: { accept: "html" },
            credentials: "same-origin"
        }).then(res => {
            log.info(`Logged out of TradingView`);
        });
    });
    await page.reload({
        waitUntil: 'networkidle2'
    });
};
export const checkForInvalidSymbol = async (page, symbol) => {
    // this function could be used when navigating by typing or by the url using ?symbol=ASDF
    // now see if it's invalid symbol, could be multi-chart so check active
    if (await isXpathVisible(page, "//div[contains(@class,'chart-container') and contains(@class,' active')]//*/div[contains(@class, 'invalidSymbol') and not(contains(@class, 'js-hidden'))]")) {
        log.error("currently showing an invalid symbol");
        const invalidSymbolError = new InvalidSymbolError();
        invalidSymbolError.symbol = symbol;
        throw invalidSymbolError;
    }
};
export const navigateToSymbol = async (page, symbol) => {
    await page.keyboard.press('Escape');
    await waitForTimeout(.5);
    await page.keyboard.press('Escape');
    await waitForTimeout(.5);
    await page.keyboard.type(`A`, { delay: 0.3 }); // just type a letter <- allows formulas to work, eg. 1/USD...
    await page.keyboard.press('Backspace');
    await waitForTimeout(.3);
    await page.keyboard.type(`${symbol}`, { delay: 0.3 });
    await waitForTimeout(.3);
    await page.keyboard.press('Enter');
    await waitForTimeout(1.5);
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
    const selectFromDropDown = async (conditionToMatchArg) => {
        let conditionToMatch = conditionToMatchArg;
        let targetOccurrence = 0;
        const match = conditionToMatch.match(/(.*?)\[(\d+)\]$/);
        // if match is not null, then the number to look for should be match[1]
        if (match) {
            conditionToMatch = match[1];
            targetOccurrence = Number.parseInt(match[2]);
            log.trace(`Indexed condition used: ${kleur.yellow(conditionToMatchArg)}\n Setting occurrence to ${kleur.blue(targetOccurrence)}`);
        }
        log.trace(`searching menu for ${kleur.yellow(conditionToMatch)}`);
        const selector = "//span[@class='tv-control-select__dropdown tv-dropdown-behavior__body i-opened']//span[@class='tv-control-select__option-wrap']";
        await page.waitForXPath(selector, { timeout: 8000 });
        const elements = await page.$x(selector);
        if (elements.length == 0) {
            await takeScreenshot(page, "zero_dropdown_options");
        }
        let found = false;
        let foundOptions = [];
        let occurrenceCount = 0;
        for (const el of elements) {
            /* istanbul ignore next */
            let optionText = await page.evaluate(element => element.innerText, el);
            optionText = optionText.replace(/[\u200B]/g, ''); // this is to remove invisible "zero width" characters like for the following:
            // Loner S​/​R (modified, 28, 5, Standard, -20, modified, 21, 3, 40, 10, 20, 5, 64, 1.5, both)
            foundOptions.push(optionText);
            if (isMatch(conditionToMatch, optionText)) {
                if (occurrenceCount == targetOccurrence) {
                    log.trace(`Found! Clicking ${kleur.yellow(optionText)}`);
                    found = true;
                    el.click();
                    return;
                }
                else {
                    log.trace(`Matching option found, but not occurrenceCount ${kleur.blue(occurrenceCount)} not matching targetOccurrence `);
                    occurrenceCount += 1;
                }
            }
        }
        if (!found)
            throw new SelectionError(conditionToMatch, foundOptions);
    };
    const performActualEntry = async (key) => {
        const conditionOrInputValue = String(condition[key]);
        log.trace(`Processing ${kleur.blue(key)}: ${kleur.yellow(conditionOrInputValue)}`);
        await waitForTimeout(.8);
        if (conditionOrInputValue !== "null" && String(conditionOrInputValue).length > 0) {
            try {
                log.trace(`Looking for DROPDOWN xpath of ${kleur.yellow(key)}`);
                const targetElement = await fetchFirstXPath(page, dropdownXpathQueries[key], 3000);
                // must be a dropdown...
                log.trace(`Found dropdown! Clicking element of ${kleur.yellow(key)}`);
                targetElement.click();
                await waitForTimeout(.9, "let dropdown populate");
                await selectFromDropDown(conditionOrInputValue);
                await waitForTimeout(.4, "after selecting from dropdown");
            }
            catch (e) {
                if (e.constructor.name === "TimeoutError") {
                    if (!inputXpathQueries[key])
                        throw (new NoInputFoundError(`Unable to find dropdown xpath target for primaryLeft/secondary. Make sure chart layout is SAVED with an indicator that contains/matches this: ${conditionOrInputValue}`));
                    log.trace(`Timed out looking for dropdown. Looking for INPUT xpath of ${kleur.yellow(key)}`);
                    try {
                        const valueInput = await fetchFirstXPath(page, inputXpathQueries[key], 1000);
                        log.trace(`Typing value: ${kleur.blue(conditionOrInputValue)}`);
                        await clickInputAndDelete(page, valueInput);
                        await valueInput.type(String(conditionOrInputValue));
                    }
                    catch (inputError) {
                        if (inputError.constructor.name === "TimeoutError") {
                            if (!readOnlyInputQueries[key])
                                throw (new NoInputFoundError(`Unable to find 'readonlyInput' xpath target for ${key} which doesn't have inputs, so won't even try`));
                            log.trace(`Timed out looking for input. Looking for READ-ONLY INPUT xpath of ${kleur.yellow(key)}`);
                            try {
                                const valueReadonlyInput = await fetchFirstXPath(page, readOnlyInputQueries[key], 1000);
                                /* istanbul ignore next */
                                const readOnlyValue = await page.evaluate((el) => el.value, valueReadonlyInput);
                                if (readOnlyValue === conditionOrInputValue) {
                                    log.trace(`looks like the readonly input is actually ${conditionOrInputValue} as expected`);
                                }
                                else {
                                    throw new Error(`Read only input value for ${key} is ${readOnlyValue}, but expected ${conditionOrInputValue}`);
                                }
                            }
                            catch (readOnlyInputError) {
                                if (readOnlyInputError.constructor.name === "TimeoutError") {
                                    throw new NoInputFoundError(`Unable to find any inputs for '${key}' for configured value: '${conditionOrInputValue}'`);
                                }
                                else {
                                    throw readOnlyInputError;
                                }
                            }
                        }
                        else {
                            throw inputError;
                        }
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
    await waitForTimeout(.4);
    if (!!option) {
        log.trace(`Looking for option: ${kleur.blue(option)}`);
        const selector = "//*[@class='js-fire-rate-row']//div[@data-title]";
        try {
            await page.waitForXPath(selector, { timeout: 8000 });
        }
        catch (e) {
            if (e.constructor.name === "TimeoutError") {
                throw new Error(`No fire rate 'option' available, but one was specified in alert configuration: ${option}`);
            }
            else {
                throw e;
            }
        }
        const elements = await page.$x(selector);
        let found = false;
        let foundOptions = [];
        for (const el of elements) {
            /* istanbul ignore next */
            let optionText = await page.evaluate(element => element.dataset.title, el);
            foundOptions.push(optionText);
            if (optionText === option && !found) {
                log.trace(`Found! Clicking ${kleur.yellow(optionText)}`);
                found = true;
                await waitForTimeout(.4);
                /* istanbul ignore next */
                await page.evaluate((text) => {
                    const el = document.evaluate(`//*[@class='js-fire-rate-row']//div[@data-title='${text}']`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    el.click();
                }, option);
                await waitForTimeout(.4);
                const justClickedEl = await fetchFirstXPath(page, `//*[@class='js-fire-rate-row']//div[@data-title='${option}']/..`);
                /* istanbul ignore next */
                const className = await page.evaluate(el => el.className, justClickedEl);
                if (className.indexOf("i-active") < 0) {
                    log.error("option element was clicked, but it's parent does not have the 'i-active' class assigned");
                    throw Error("Unable to select option correctly...a bug in the system");
                }
            }
        }
        if (!found)
            throw new SelectionError(option, foundOptions);
    }
    // alert actions
    for (const [configKey, elementInputName] of Object.entries(alertActionCorresponding)) {
        if (!!actions && !!actions[configKey] !== undefined) {
            await waitForTimeout(.3);
            const el = await fetchFirstXPath(page, `//div[contains(@class, 'tv-dialog')]//input[@name='${elementInputName}']`);
            /* istanbul ignore next */
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
            else if (configKey === "playSound") {
                const moreOptionsEl = await fetchFirstXPath(page, "//span[contains(@class, 'toggle-text--less')]/..", 1000);
                moreOptionsEl.evaluate(b => b.click());
                if (isChecked != actions.playSound?.enabled) {
                    log.trace(`setting ${kleur.blue("play-sound")} input as checked`);
                    el.click();
                    await waitForTimeout(.3);
                }
                if (actions.playSound?.enabled && actions.playSound?.name && actions.playSound?.duration) {
                    {
                        await waitForTimeout(.5);
                        log.trace(`Looking for DROPDOWN xpath of ${kleur.yellow("playSound.name")}`);
                        const targetElement = await fetchFirstXPath(page, dropdownSoundXpathQueries["name"], 3000);
                        log.trace(`Found dropdown! Clicking element of ${kleur.yellow(actions.playSound.name)}`);
                        targetElement.evaluate((b) => b.click());
                        await waitForTimeout(.3);
                        await selectFromDropDown(actions.playSound.name);
                    }
                    {
                        await waitForTimeout(.5);
                        log.trace(`Looking for DROPDOWN xpath of ${kleur.yellow("playSound.duration")}`);
                        const targetElement = await fetchFirstXPath(page, dropdownSoundXpathQueries["duration"], 3000);
                        log.trace(`Found dropdown! Clicking element of ${kleur.yellow(actions.playSound.duration)}`);
                        targetElement.evaluate((b) => b.click());
                        await waitForTimeout(.3);
                        await selectFromDropDown(actions.playSound.duration);
                    }
                    await waitForTimeout(.5);
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
    submitButton.evaluate((b) => b.click());
};
// sometimes there's a warning of "this alert may trigger differently than expected"
export const clickContinueIfWarning = async (page) => {
    try {
        log.trace("clickContinueIfWarning()");
        const continueAnywayButton = await fetchFirstXPath(page, `//button[@name='continue']`, 3000, false);
        continueAnywayButton.evaluate((b) => b.click());
        await waitForTimeout(4, "waiting after clicking 'continue anyway' button");
    }
    catch (error) {
        log.trace("No warning dialog");
    }
};
export const addAlert = async (page, singleAlertSettings) => {
    log.trace("addAlert()");
    const typeShortcutForAlertDialog = async () => {
        log.trace("addAlert()...pressing shortcut key");
        await page.keyboard.press('Escape');
        await waitForTimeout(.5);
        await page.keyboard.press('Escape');
        await waitForTimeout(.5);
        await page.keyboard.down('AltLeft');
        await page.keyboard.press("a");
        await page.keyboard.up('AltLeft');
        await waitForTimeout(.5, "after keyboard shortcut for new alert dialog");
    };
    await typeShortcutForAlertDialog();
    log.trace("..make sure we're showing the alert dialog");
    const isNotShowingAlertDialog = async () => {
        return !(await isXpathVisible(page, "//div[contains(@class, 'tv-alert-dialog')]"));
    };
    if (await isNotShowingAlertDialog()) {
        log.warn("NOT showing alert dialog! maybe invalid symbol?");
        if (await isXpathVisible(page, "//*[text()=\"Can't create alert on invalid symbol\"]")) {
            log.error("Looks like we tried to create alert on invalid symbol, throwing error");
            throw new InvalidSymbolError();
        }
        const MAX_TRIES = 3;
        let retryCount = 1;
        while ((await isNotShowingAlertDialog()) && retryCount <= MAX_TRIES + 1) {
            if (retryCount == MAX_TRIES) {
                await takeScreenshot(page, "unable_to_bring_up_alert_dialog");
                throw new AddAlertInvocationError();
            }
            log.trace("Attempting to show alert dialog again...");
            await waitForTimeout(retryCount, "pausing a little");
            await typeShortcutForAlertDialog();
            retryCount += 1;
        }
    }
    await configureSingleAlertSettings(page, singleAlertSettings);
    await waitForTimeout(.5);
    await clickSubmit(page);
    await waitForTimeout(2);
    await clickContinueIfWarning(page);
    await waitForTimeout(2, "waiting a little after adding");
};
//# sourceMappingURL=tv-page-actions.js.map