import { waitForTimeout, isEnvEnabled } from "./common-service.js";
import log from "./log.js";
import kleur from "kleur";
import { AddAlertInvocationError, InvalidSymbolError, NoInputFoundError, SelectionError, ErrorWithScreenShot } from "../classes.js";
import RegexParser from "regex-parser";
import { accessSync, constants, writeFileSync } from "fs";
import puppeteer, { executablePath } from "puppeteer";
import path from "path";
import { mkdir } from "fs/promises";
// data-dialog-name="gopro"
const screenshot = isEnvEnabled(process.env.SCREENSHOT);
const doXpath = async (page, selector) => {
    /* istanbul ignore next */
    const response = await page.evaluate((sel) => {
        const el = document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        return !!el;
    }, selector);
    return response;
};
export const isXpathVisible = async (page, selector, screenShotOnFail = false) => {
    log.debug(kleur.gray(`...isXpathVisible?: ${kleur.yellow(selector)}`));
    const visible = await doXpath(page, selector);
    log.debug(`..isXpathVisible: ${visible}`);
    return visible;
};
export const fetchFirstXPath = async (page, selector, timeout = 20000, screenshotOnFail = true) => {
    log.debug(kleur.gray(`...selector: ${kleur.yellow(selector)}`));
    try {
        await page.waitForSelector("xpath/." + selector, { timeout });
    }
    catch (e) {
        if (screenshotOnFail)
            await takeScreenshot(page, "waitForSelectorFailed");
        throw (e);
    }
    const elements = await page.$$("xpath/." + selector);
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
        log.debug(`saving screenshot: ${screenshotPath}`);
        await page.screenshot({
            path: screenshotPath + ".webp",
        });
        const html = await page.content();
        writeFileSync(screenshotPath + ".xml", html, { encoding: "utf-8" });
    }
};
export const minimizeFooterChartPanel = async (page) => {
    log.debug(`minimizing footer chart panel`);
    try {
        const footerPanelMinimizeButton = await fetchFirstXPath(page, `//div[@id='footer-chart-panel']//button[@data-name='toggle-visibility-button' and @data-active='false']`, 5000);
        footerPanelMinimizeButton.click();
        await waitForTimeout(.4);
    }
    catch (e) {
        log.debug("no minimize button found, footer chart panel must be hidden already");
    }
};
export const convertIntervalForTradingView = (interval) => {
    return interval.split("").filter((val) => val !== "m").join("");
};
export const configureInterval = async (interval, page) => {
    log.debug(`set ${kleur.blue("interval")}: ${kleur.yellow(interval)}`);
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
    primaryLeft: "//span[@data-name='main-series-select']",
    primaryRight: "//span[@data-name='main-series-plot-select']",
    secondary: "//span[@data-name='operator-select']",
    // Only get listbox when there's either just one value
    // "//*[contains(@class, 'operatorRow-')]/..//span[@data-name='start-band-select']"
    // Or get when there's an upper and lower bound
    // "//legend[text()='Upper Bound']/../..//span[@data-name='start-band-select']"
    tertiaryLeft: "//*[contains(@class, 'operatorRow-')]/..//span[@data-name='start-band-select'] | //legend[text()='Upper Bound']/../..//span[@data-name='start-band-select']",
    tertiaryRight: "//*[contains(@class, 'operatorRow-')]/..//span[@data-name='end-band-select'] | //legend[text()='Upper Bound']/../..//span[@data-name='end-band-select']",
    quaternaryLeft: "//legend[text()='Lower Bound']/../..//span[@data-name='start-band-select']",
    quaternaryRight: "//legend[text()='Lower Bound']/../..//span[@data-name='end-band-select']",
};
const dropdownSoundXpathQueries = {
    nameTarget: "//span[@role='button' and @data-name='sound-title-select']",
    nameListItems: "//div[contains(@class, 'soundSelectMenuItem-')]//div[contains(@class, 'title-')]",
    durationTarget: "//span[@role='button' and @data-name='sound-duration-select']",
    durationListItems: "//div[@role='listbox']//span[contains(@class, 'label-')]",
};
const inputXpathQueries = {
    tertiaryLeft: "//*[contains(@class, 'operatorRow-')]/..//input[@data-property-id='start-band-range'] | //legend[text()='Upper Bound']/../..//input[@data-property-id='start-band-range']",
    tertiaryRight: "//*[contains(@class, 'operatorRow-')]/..//input[@data-property-id='end-band-range'] | //legend[text()='Upper Bound']/../..//input[@data-property-id='end-band-range']",
    quaternaryLeft: "//legend[text()='Lower Bound']/../..//input[@data-property-id='start-band-range']",
    quaternaryRight: "//legend[text()='Lower Bound']/../..//input[@data-property-id='end-band-range']",
};
const readOnlyInputQueries = {
    tertiaryLeft: "(//div[contains(@class, 'tv-alert-dialog__group-item--left ') and contains(@class, 'js-second-operand-')])[1]//input[@type='text']",
    quaternaryLeft: "(//div[contains(@class, 'tv-alert-dialog__group-item--left ') and contains(@class, 'js-second-operand-')])[2]//input[@type='text']"
};
const alertActionCorresponding = {
    notifyOnApp: "notify-on-app",
    showPopup: "show-popup",
    sendEmail: "send-email",
    webhook: "webhook",
    playSound: "play-sound"
};
const clickInputAndDelete = async (page, inputElement) => {
    await inputElement.click();
    await waitForTimeout(.5);
    /* istanbul ignore next */
    await page.evaluate((el) => {
        el.value = "";
    }, inputElement);
    await waitForTimeout(.3);
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
        executablePath: executablePath(),
        headless: headless, userDataDir,
        defaultViewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
        args: ['--no-sandbox',
            '--enable-experimental-web-platform-features', // adds support for :has selector in styleOverrides. In theory its not experimental in chrome 105
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            // '--single-process', // will cause it to die
            '--disable-gpu',
            headless && !url ? "" : `--app=${url}`,
            '--window-size=1920,1080', // otherwise headless doesn't work
            // '--incognito'
        ]
    });
};
export const login = async (page, username, pass, backupCode) => {
    try {
        const emailSignInButton = await fetchFirstXPath(page, `//div[@data-dialog-name='sign-in']//button[@name='Email']`, 5000);
        emailSignInButton.click();
        await waitForTimeout(1);
    }
    catch (e) {
        log.warn("no email toggle button showing!");
    }
    const usernameInput = await fetchFirstXPath(page, '//input[@name=\'id_username\']');
    await usernameInput.type(`${username}`);
    await waitForTimeout(.5);
    await takeScreenshot(page, "shouldbe_before_password_entry");
    const passwordInput = await fetchFirstXPath(page, '//input[@name=\'id_password\']');
    log.debug("typing password");
    await passwordInput.type(pass);
    await waitForTimeout(.5);
    const submitButton = await fetchFirstXPath(page, "//div[@data-dialog-name='sign-in']//button[contains(@class, 'submitButton')]");
    log.debug("clicking submit button");
    submitButton.click();
    await waitForTimeout(2);
    let twoFactorOrBackupCodeInput = null;
    try {
        twoFactorOrBackupCodeInput = await fetchFirstXPath(page, "//div[@data-dialog-name='sign-in']//input[@id='id_code']", 5000);
    }
    catch (e) {
        log.warn("Two Factor Authentication / Backup Code input not showing");
    }
    if (twoFactorOrBackupCodeInput !== null) {
        if (!backupCode) {
            log.warn(`${kleur.yellow("MANUAL ACTION NEEDED: ")} You have 30 seconds to enter your 2FA or backup code`);
            await waitForTimeout(30 * 1000);
        }
        else {
            await twoFactorOrBackupCodeInput.type(`${backupCode}`);
            await waitForTimeout(3);
        }
    }
    let possibleErrorElement = null;
    try {
        possibleErrorElement = await fetchFirstXPath(page, "//div[@data-dialog-name='sign-in']//div[contains(@class, 'mainProblem')]//div[contains(@class,'text-wrap')]/span", 5000);
    }
    catch (e) {
        log.warn("doesn't seem like there's an error..");
    }
    if (possibleErrorElement) {
        const errorText = await page.evaluate(element => element.innerText, possibleErrorElement);
        await takeScreenshot(page, "loginError");
        throw new ErrorWithScreenShot(errorText, "loginError");
    }
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
        log.debug(`Parsing what appears to be regular expression: ${kleur.yellow(needle)} ... Haystack: ${kleur.gray(haystack)}`);
        const regexp = RegexParser(needle);
        return !!regexp.exec(haystack);
    }
    else {
        return haystack.indexOf(needle) > -1;
    }
};
export const configureSingleAlertSettings = async (page, singleAlertSettings) => {
    const { condition, name, expireOpenEnded, expireInterval, option, message, actions } = singleAlertSettings;
    await takeScreenshot(page, "alert_begin_configure");
    const selectFromDropDown = async (conditionToMatchArg, selector) => {
        log.debug(`..selectFromDropDown() using selector: ${kleur.yellow(selector)}`);
        await page.waitForSelector("xpath/." + selector, { timeout: 8000 });
        const elements = await page.$$("xpath/." + selector);
        if (elements.length == 0) {
            log.warn("zero dropdown options found with selector");
            await takeScreenshot(page, "zero_dropdown_options");
        }
        let conditionToMatch = conditionToMatchArg;
        let targetOccurrence = 0;
        const match = conditionToMatch.match(/(.*?)\[(\d+)\]$/);
        // if match is not null, then the number to look for should be match[1]
        if (match) {
            conditionToMatch = match[1];
            targetOccurrence = Number.parseInt(match[2]);
            log.debug(`Indexed condition used: ${kleur.yellow(conditionToMatchArg)}\n Setting occurrence to ${kleur.blue(targetOccurrence)}`);
        }
        log.debug(`searching menu for ${kleur.yellow(conditionToMatch)}`);
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
                    log.debug(`Found! Clicking ${kleur.yellow(optionText)}`);
                    found = true;
                    el.click();
                    return;
                }
                else {
                    log.debug(`Matching option found, but not occurrenceCount ${kleur.blue(occurrenceCount)} not matching targetOccurrence `);
                    occurrenceCount += 1;
                }
            }
        }
        if (!found)
            throw new SelectionError(conditionToMatch, foundOptions);
    };
    const performActualEntry = async (key) => {
        const conditionOrInputValue = String(condition[key]);
        log.debug(`Processing ${kleur.blue(key)}: ${kleur.yellow(conditionOrInputValue)}`);
        await waitForTimeout(.8);
        if (conditionOrInputValue !== "null" && String(conditionOrInputValue).length > 0) {
            try {
                log.debug(`Looking for DROPDOWN xpath of ${kleur.yellow(key)}`);
                const targetElement = await fetchFirstXPath(page, dropdownXpathQueries[key], 3000);
                // must be a dropdown...
                log.debug(`Found dropdown! Clicking element of ${kleur.yellow(key)}`);
                targetElement.click();
                await waitForTimeout(.9, "let dropdown populate");
                await selectFromDropDown(conditionOrInputValue, "//div[@data-name='popup-menu-container']//div[@role='option']/span/span/div/div/span");
                await waitForTimeout(.4, "after selecting from dropdown");
            }
            catch (e) {
                if (e.constructor.name === "TimeoutError") {
                    if (!inputXpathQueries[key])
                        throw (new NoInputFoundError(`Unable to find dropdown xpath target for primaryLeft/secondary. Make sure chart layout is SAVED with an indicator that contains/matches this: ${conditionOrInputValue}`));
                    log.debug(`Timed out looking for dropdown. Looking for INPUT xpath of ${kleur.yellow(key)}`);
                    try {
                        const valueInput = await fetchFirstXPath(page, inputXpathQueries[key], 1000);
                        log.debug(`Typing value: ${kleur.blue(conditionOrInputValue)}`);
                        await clickInputAndDelete(page, valueInput);
                        await valueInput.type(String(conditionOrInputValue));
                    }
                    catch (inputError) {
                        if (inputError.constructor.name === "TimeoutError") {
                            if (!readOnlyInputQueries[key])
                                throw (new NoInputFoundError(`Unable to find 'readonlyInput' xpath target for ${key} which doesn't have inputs, so won't even try`));
                            log.debug(`Timed out looking for input. Looking for READ-ONLY INPUT xpath of ${kleur.yellow(key)}`);
                            try {
                                const valueReadonlyInput = await fetchFirstXPath(page, readOnlyInputQueries[key], 1000);
                                /* istanbul ignore next */
                                const readOnlyValue = await page.evaluate((el) => el.value, valueReadonlyInput);
                                if (readOnlyValue === conditionOrInputValue) {
                                    log.debug(`looks like the readonly input is actually ${conditionOrInputValue} as expected`);
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
            log.debug("NoInputFoundError, maybe we need to send secondary before setting primaryRight");
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
    // if (!!option) {
    //     log.debug(`Looking for option: ${kleur.blue(option)}`)
    //
    //     try {
    //
    //         const targetElement = await fetchFirstXPath(page, "//fieldset[@aria-label='Trigger']//span[@role='button']", 3000)
    //         log.debug(`Found dropdown! Clicking element of ${kleur.yellow(option)}`)
    //         targetElement.evaluate((b) => b.click())
    //         await waitForTimeout(.3)
    //         await selectFromDropDown(option, "//div[@data-name='popup-menu-container']//div[@role='option']/span/span/div")
    //
    //     } catch (e) {
    //         if (e.constructor.name === "TimeoutError") {
    //             throw new Error(`No fire rate 'option' available, but one was specified in alert configuration: ${option}`)
    //         } else {
    //             throw e
    //         }
    //     }
    //
    // }
    if (!!option) {
        log.debug(`Looking for option: ${kleur.blue(option)}`);
        const selector = "//legend[text()='Trigger']/../..//button//span[contains(@class,'ellipsis-container')]";
        try {
            await page.waitForSelector("xpath/." + selector, { timeout: 8000 });
        }
        catch (e) {
            if (e.constructor.name === "TimeoutError") {
                throw new Error(`No fire rate 'option' available, but one was specified in alert configuration: ${option}`);
            }
            else {
                throw e;
            }
        }
        const elements = await page.$$("xpath/." + selector);
        let found = false;
        let foundOptions = [];
        for (const el of elements) {
            /* istanbul ignore next */
            let optionText = await page.evaluate(element => element.innerText, el);
            foundOptions.push(optionText.trim());
            if (optionText === option && !found) {
                log.debug(`Found! Clicking ${kleur.yellow(optionText)}`);
                found = true;
                await waitForTimeout(.4);
                await el.click();
                // /* istanbul ignore next */
                // await page.evaluate((text) => {
                //     const el = document.evaluate(`//*[@class='js-fire-rate-row']//div[@data-title='${text}']`,
                //         document,
                //         null,
                //         XPathResult.FIRST_ORDERED_NODE_TYPE,
                //         null
                //     ).singleNodeValue as HTMLElement
                //     el.click()
                //
                // }, option)
                await waitForTimeout(.4);
                // const justClickedEl = await fetchFirstXPath(page, `//*[@class='js-fire-rate-row']//div[@data-title='${option}']/..`)
                //
                // /* istanbul ignore next */
                // const className = await page.evaluate(el => el.className, justClickedEl);
                //
                // if (className.indexOf("i-active") < 0) {
                //     log.error("option element was clicked, but it's parent does not have the 'i-active' class assigned")
                //     throw Error("Unable to select option correctly...a bug in the system")
                // }
            }
        }
        if (!found)
            throw new SelectionError(option, foundOptions);
    }
    if (expireOpenEnded !== undefined) {
        log.debug("set whether to expire open ended");
        await waitForTimeout(.1);
        const expDropdownTarget = await fetchFirstXPath(page, "//legend[text()='Expiration']/../..//button");
        await expDropdownTarget.click();
        await waitForTimeout(.4);
        const openEndedCheckbox = await fetchFirstXPath(page, `//input[@id='unexpired-date']`);
        const isOpenEnded = await page.evaluate(element => element.checked, openEndedCheckbox);
        if (expireOpenEnded != isOpenEnded) {
            openEndedCheckbox.click();
        }
        await waitForTimeout(.3);
        if (!expireOpenEnded && expireInterval) {
            log.info(`Set Expiration ${kleur.blue(expireInterval)} hours in the future`);
            const dateInput = await fetchFirstXPath(page, "//div[contains(@class, 'pickerInput-')]//input");
            const timeInput = await fetchFirstXPath(page, "//div[contains(@class, 'time-')]//input");
            const dateISO = await page.evaluate((expireInterval) => {
                console.log("expireInterval: " + expireInterval);
                const currentDate = new Date();
                currentDate.setTime(currentDate.getTime() - (currentDate.getTimezoneOffset() * 60000) + expireInterval * 60 * 60 * 1000);
                return currentDate.toISOString();
            }, expireInterval);
            const [splitDate, timeFull] = dateISO.split("T");
            const [hours, min, secs] = timeFull.split(":");
            const expDate = splitDate.replaceAll("-", "");
            const expTime = `${hours}${min}`;
            log.debug(`exp_date: ${expDate}`);
            log.debug(`exp_time: ${expTime}`);
            await dateInput.click();
            await waitForTimeout(50);
            await page.keyboard.press('End');
            for (const l of "yyyy-mm-dd".split("")) {
                await waitForTimeout(50);
                await page.keyboard.press('Backspace');
            }
            await dateInput.type(String(expDate));
            await waitForTimeout(50);
            await timeInput.click();
            await waitForTimeout(50);
            await page.keyboard.press('End');
            for (const l of "hh:mm".split("")) {
                await waitForTimeout(50);
                await page.keyboard.press('Backspace');
            }
            await timeInput.type(String(expTime));
            await waitForTimeout(.2);
        }
        await waitForTimeout(.2);
        const expSubmitButton = await fetchFirstXPath(page, "//div[@data-name='popup-menu-container']//div[@data-name='menu-inner']/div/button");
        await expSubmitButton.click();
    }
    if (!!name) {
        log.debug(`Setting Alert Name: ${kleur.blue(name)}`);
        const nameInput = await fetchFirstXPath(page, "//input[@id='alert-name']");
        await clickInputAndDelete(page, nameInput);
        await nameInput.type(name);
        await waitForTimeout(.5);
    }
    if (!!message) {
        log.debug(`Setting message: ${kleur.blue(message)}`);
        try {
            const messageTextarea = await fetchFirstXPath(page, "//textarea[@id='alert-message']", 1000, false);
            await clickInputAndDelete(page, messageTextarea);
            await messageTextarea.type(message);
        }
        catch (e) {
            if (e.constructor.name === "TimeoutError") {
                log.warn(`No message box found, but message specified: ${message}`);
            }
            else {
                throw e;
            }
        }
    }
    await waitForTimeout(.2);
    const notificationsTab = await fetchFirstXPath(page, "//button[@id='alert-dialog-tabs__notifications']");
    await notificationsTab.click();
    await waitForTimeout(.4);
    // alert actions
    for (const [configKey, elementInputName] of Object.entries(alertActionCorresponding)) {
        if (!!actions && !!actions[configKey] !== undefined) {
            await waitForTimeout(.3);
            const el = await fetchFirstXPath(page, `//input[@data-name='${elementInputName}']`);
            /* istanbul ignore next */
            const isChecked = await page.evaluate(element => element.checked, el);
            if (configKey === "webhook") {
                if (isChecked != actions.webhook.enabled) {
                    log.debug(`setting ${kleur.blue("webhook")} as checked`);
                    el.click();
                    await waitForTimeout(.3);
                }
                if (actions.webhook.enabled && actions.webhook.url) {
                    await waitForTimeout(.3);
                    log.debug(`typing webhook url: ${kleur.blue(actions.webhook.url)}`);
                    const webhookUrlEl = await fetchFirstXPath(page, `//input[contains(@placeholder, 'alert-hook')]`, 1000);
                    await clickInputAndDelete(page, webhookUrlEl);
                    await webhookUrlEl.type(String(actions.webhook.url));
                }
            }
            else if (configKey === "playSound") {
                if (actions.playSound?.enabled !== undefined && isChecked != actions.playSound?.enabled) {
                    log.debug(`setting ${kleur.blue("play-sound")} input as checked`);
                    el.click();
                    await waitForTimeout(.3);
                }
                if (actions.playSound?.enabled && actions.playSound?.name && actions.playSound?.duration) {
                    {
                        await waitForTimeout(.5);
                        log.debug(`Looking for DROPDOWN xpath of ${kleur.yellow("playSound.name")}`);
                        const targetElement = await fetchFirstXPath(page, dropdownSoundXpathQueries["nameTarget"], 3000);
                        log.debug(`Found dropdown! Clicking element of ${kleur.yellow(actions.playSound.name)}`);
                        targetElement.evaluate((b) => b.click());
                        await waitForTimeout(.3);
                        await selectFromDropDown(actions.playSound.name, dropdownSoundXpathQueries["nameListItems"]);
                    }
                    {
                        await waitForTimeout(.5);
                        log.debug(`Looking for DROPDOWN xpath of ${kleur.yellow("playSound.duration")}`);
                        const targetElement = await fetchFirstXPath(page, dropdownSoundXpathQueries["durationTarget"], 3000);
                        log.debug(`Found dropdown! Clicking element of ${kleur.yellow(actions.playSound.duration)}`);
                        targetElement.evaluate((b) => b.click());
                        await waitForTimeout(.3);
                        await selectFromDropDown(actions.playSound.duration, dropdownSoundXpathQueries["durationListItems"]);
                    }
                    await waitForTimeout(.5);
                }
            }
            else {
                if (isChecked != actions[configKey]) {
                    log.debug(`setting ${kleur.blue(configKey)} as checked`);
                    el.click();
                }
            }
        }
    }
};
export const clickSubmit = async (page) => {
    log.debug("clickSubmit()");
    const submitButton = await fetchFirstXPath(page, "//div[contains(@data-name, 'alerts-create-edit-dialog')]//button[@data-name='submit']");
    submitButton.evaluate((b) => b.click());
};
// sometimes there's a warning of "this alert may trigger differently than expected"
export const clickContinueIfWarning = async (page) => {
    try {
        log.debug("clickContinueIfWarning()");
        const continueAnywayButton = await fetchFirstXPath(page, `//button[@name='continue']`, 3000, false);
        continueAnywayButton.evaluate((b) => b.click());
        await waitForTimeout(4, "waiting after clicking 'continue anyway' button");
    }
    catch (error) {
        log.debug("No warning dialog");
    }
};
export const addAlert = async (page, singleAlertSettings) => {
    log.debug("addAlert()");
    const typeShortcutForAlertDialog = async () => {
        log.debug("addAlert()...pressing shortcut key");
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
    await waitForTimeout(.7, "..make sure we're showing the alert dialog");
    const isNotShowingAlertDialog = async () => {
        return !(await isXpathVisible(page, "//div[contains(@data-name, 'alerts-create-edit-dialog')]"));
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
            log.debug("Attempting to show alert dialog again...");
            await waitForTimeout(retryCount, "pausing a little");
            await typeShortcutForAlertDialog();
            retryCount += 1;
        }
    }
    await configureSingleAlertSettings(page, singleAlertSettings);
    await waitForTimeout(.5);
    await takeScreenshot(page, "before_submitting_alert");
    await clickSubmit(page);
    await waitForTimeout(2);
    await clickContinueIfWarning(page);
    await waitForTimeout(2, "waiting a little after adding");
};
//# sourceMappingURL=tv-page-actions.js.map