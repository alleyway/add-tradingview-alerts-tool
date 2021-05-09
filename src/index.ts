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
import {waitForTimeout, atatVersion, isEnvEnabled} from "./service/common-service.js"
import log from "./service/log.js"

import {IExchangeSymbol, ISingleAlertSettings } from "./interfaces.js"

export type {IExchangeSymbol, ISingleAlertSettings}

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
    atatVersion,
    log,
    isEnvEnabled

}

