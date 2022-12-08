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
    fetchFirstXPath,
    checkForInvalidSymbol,
    launchBrowser,
    isXpathVisible
} from "./service/tv-page-actions"
import {SelectionError, InvalidSymbolError, AddAlertInvocationError} from "./classes";
import {fetchSymbolsForSource} from "./service/exchange-service"
import {waitForTimeout, atatVersion, isEnvEnabled, styleOverride} from "./service/common-service"
import log from "./service/log"

import {IBaseSymbol, ISingleAlertSettings, ClassificationType, soundNames, soundDurations} from "./interfaces"
import {MasterSymbol} from "./classes";

export type {IBaseSymbol, ISingleAlertSettings, MasterSymbol, ClassificationType}

export {
    launchBrowser,
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
    InvalidSymbolError,
    convertIntervalForTradingView,
    checkForInvalidSymbol,
    styleOverride,
    isXpathVisible,
    AddAlertInvocationError,
    soundDurations,
    soundNames
}

