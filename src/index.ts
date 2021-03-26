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
} from "./service/tv-page-actions"
import {fetchPairsForExchange} from "./service/exchange-service"
import {waitForTimeout} from "./service/common-service"
import log from "./service/log"
import {ISingleAlertSettings} from "./interfaces";

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
    waitForTimeout,
    log
}

