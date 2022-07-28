
import {isEnvEnabled, styleOverride, waitForTimeout} from "./common-service";
import {launchBrowser, login} from "./tv-page-actions";
import log from "./log";


describe('tv-page-actions tests', () => {

    jest.setTimeout(120000)
    let browser

    let page

    beforeAll(async () => {
        console.log("current working directory: " + process.cwd())
        const headless = isEnvEnabled(process.env.HEADLESS)

        const chartUrl = process.env.TEST_TRADINGVIEW_CHART
        const username = process.env.TEST_TRADINGVIEW_USERNAME
        const password = process.env.TEST_TRADINGVIEW_PASSWORD

        browser = await launchBrowser(false, `${chartUrl}#signin`)

        let accessDenied;

        if (headless) {
            page = await browser.newPage();

            log.trace(`Go to ${chartUrl} and wait until domcontentloaded`)
            const pageResponse = await page.goto(chartUrl + "#signin", {
                waitUntil: 'domcontentloaded'
            });
            await waitForTimeout(5, "let page load and see if access is denied")
            /* istanbul ignore next */
            await page.addStyleTag({content: styleOverride})

            accessDenied = pageResponse.status() === 403

        } else {
            page = (await browser.pages())[0];
            await waitForTimeout(5, "let page load and see if access is denied")
            await page.addStyleTag({content: styleOverride})
            /* istanbul ignore next */
            accessDenied = await page.evaluate(() => {
                return document.title.includes("Denied");
            });
        }

        if (accessDenied) {
            log.info("Access denied, logging in...")
            if (username && password) {

                await login(page, username, password)

            }

        }

        await waitForTimeout(3, "wait a little longer for page to load")
    });


    afterAll(async () => {
        console.log("shutting down")
        await browser.close()
    })

    it('dummy tv-page-actions test', async () => {
        expect("blah").toBeDefined()
    })


});


