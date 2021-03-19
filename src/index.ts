import {
    clickContinueIfWarning,
    takeScreenshot,
    configureInterval,
    configureSingleAlertSettings,
    clickSubmit,
    addAlert,
    navigateToSymbol,
    login,
    logout,
    fetchFirstXPath
} from "./service/tv-page-actions.js"
import {fetchPairsForExchange} from "./service/exchange-service.js"
import {waitForTimeout} from "./service/common-service.js"
import log from "./service/log.js"
import {ISingleAlertSettings, ICsvSymbol} from "./interfaces";

export {
    fetchFirstXPath,
    clickContinueIfWarning,
    takeScreenshot,
    configureInterval,
    configureSingleAlertSettings,
    clickSubmit,
    addAlert,
    navigateToSymbol,
    login,
    logout,
    fetchPairsForExchange,
    ISingleAlertSettings,
    ICsvSymbol,
    waitForTimeout,
    log
}

