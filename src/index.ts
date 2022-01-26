import {
    clickContinueIfWarning,
    takeScreenshot,
    configureInterval,
    convertIntervalForTradingView,
    configureSingleAlertSettings,
    clickSubmit,
    addAlert,
    navigateToSymbol,
    login,
    logout,
    fetchFirstXPath
} from "./service/tv-page-actions"
import {SelectionError} from "./classes";
import {fetchSymbolsForSource} from "./service/exchange-service"
import {waitForTimeout, atatVersion, isEnvEnabled} from "./service/common-service"
import log from "./service/log"

import {IBaseSymbol, ISingleAlertSettings} from "./interfaces"
import {MasterSymbol} from "./classes";

export type {IBaseSymbol, ISingleAlertSettings, MasterSymbol}

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
    fetchSymbolsForSource,
    waitForTimeout,
    atatVersion,
    log,
    isEnvEnabled,
    SelectionError,
    convertIntervalForTradingView
}

