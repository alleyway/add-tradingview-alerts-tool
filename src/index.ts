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
    waitForTimeout,
    log
}

