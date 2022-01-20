import {IBaseSymbol} from "../interfaces";
import {BaseSymbol} from "../classes";
import axios, {AxiosRequestConfig} from "axios";
import log from "./log";
import kleur from "kleur";

const BINANCEFUTURES = "binancefutures"
const BINANCE = "binance"
const BINANCEUS = "binanceus"
const BITTREX = "bittrex"
const COINBASE = "coinbase"
const FTX = "ftx"
const KRAKEN = "kraken"
const KUCOIN = "kucoin"
const OKEX = "okex"
const BYBIT = "bybit"
// const BYBIT_SPOT = "bybit_spot"

export const sourcesAvailable = [BINANCEFUTURES, BINANCE, BINANCEUS, BITTREX, COINBASE, FTX, KRAKEN, KUCOIN, OKEX, BYBIT]

const CONST_ALL = "all"

const logJson = (obj, name: string = "") => {
    log.trace(`${name} \n ${kleur.yellow(JSON.stringify(obj, null, 4))}`)
}


const fetchAndTransform = async (url, responsePath, transformer: (any) => IBaseSymbol) => {

    const responseObject = await fetch(url)

    const resultsArray = responsePath ? responseObject.data[responsePath] : responseObject.data

    const baseSymbols: IBaseSymbol[] = []

    log.info(`found ${resultsArray.length} results from the API`)

    for (const obj of resultsArray) {

        const baseSymbol: IBaseSymbol = transformer(obj)
        if (baseSymbol) baseSymbols.push(baseSymbol)
    }

    log.info(`returning ${baseSymbols.length} results symbols parsed`)

    return baseSymbols
}

const fetch = (url: string) => {

    const options: AxiosRequestConfig = {
        method: "GET",
        url: url
    };

    return axios(options)
}

export const fetchByBit = async (): Promise<IBaseSymbol[]> => {

    // Inverse, usdt perp, and inverse futures all share same endpoint
    // https://bybit-exchange.github.io/docs/inverse/#t-querysymbol

    const transformer = (obj) => {

        if (obj.status === "Trading") {
            return new BaseSymbol("BYBIT", obj.base_currency, obj.quote_currency, `BYBIT:${obj.alias}`)
        } else {
            //logJson(obj, "ByBit Discarded:")
            return null
        }
    }

    return fetchAndTransform("https://api.bybit.com/v2/public/symbols", "result", transformer)
}

export const fetchByBitSpot = async (): Promise<IBaseSymbol[]> => {

    // Inverse, usdt perp, and inverse futures all share same endpoint
    // https://bybit-exchange.github.io/docs/inverse/#t-querysymbol

    const transformer = (obj) => {
        return new BaseSymbol("BYBIT", obj.baseCurrency, obj.quoteCurrency, `BYBIT:${obj.alias}`)
    }

    return fetchAndTransform("https://api.bybit.com/spot/v1/symbols", "result", transformer)
}

export const fetchKucoin = async (): Promise<IBaseSymbol[]> => {

    const transformer = (obj) => {
        if (obj.enableTrading) {
            return new BaseSymbol("KUCOIN", obj.baseCurrency, obj.quoteCurrency)
        } else {
            //logJson(obj, "Kucoin Discarded:")
            return null
        }
    }
    return fetchAndTransform("https://api.kucoin.com/api/v1/symbols", "data", transformer)
}

export const fetchKraken = async (): Promise<IBaseSymbol[]> => {

    const resp = await fetch("https://api.kraken.com/0/public/AssetPairs")

    const responseObject = await resp.data

    // @ts-ignore
    const symbolsObject = responseObject.result

    const baseSymbols: IBaseSymbol[] = []

    const keys = Object.keys(symbolsObject);
    log.info(`found ${keys.length} results from the API`)

    for (const key of keys) { // key = "AAVEAUD"
        const obj = symbolsObject[key]
        const [symbolBase, symbolQuote] = obj.wsname.split("\/") // "AAVE\/AUD"
        baseSymbols.push(
            new BaseSymbol("KRAKEN", symbolBase, symbolQuote)
        )
    }

    log.info(`returning ${baseSymbols.length} results symbols parsed`)

    return baseSymbols
}

export const fetchBittrex = async (): Promise<IBaseSymbol[]> => {

    const transformer = (obj) => {
        if (obj.IsActive) {
            return new BaseSymbol("BITTREX", obj.MarketCurrency, obj.BaseCurrency)
        } else {
            //logJson(obj, "Bittrex Discarded:")
            return null
        }
    }
    return fetchAndTransform("https://api.bittrex.com/api/v1.1/public/getmarkets", "result", transformer)
}

export const fetchCoinbase = async (): Promise<IBaseSymbol[]> => {

    const transformer = (obj) => {
        if (!obj.trading_disabled && obj.status == "online") {
            return new BaseSymbol("COINBASE", obj.base_currency, obj.quote_currency)

        } else {
            //logJson(obj, "Coinbase Discarded:")
            return null
        }
    }
    return fetchAndTransform("https://api.pro.coinbase.com/products", null, transformer)

}

export const fetchFtx = async (): Promise<IBaseSymbol[]> => {

    const transformer = (obj) => {
        if (obj.enabled) {
            if (obj.type === "spot") {

                // {
                //     "name": "1INCH/USD",
                //     "enabled": true,
                //     "postOnly": false,
                //     "priceIncrement": 0.0001,
                //     "sizeIncrement": 1.0,
                //     "minProvideSize": 1.0,
                //     "last": 2.3708,
                //     "bid": 2.3688,
                //     "ask": 2.371,
                //     "price": 2.3708,
                //     "type": "spot",
                //     "baseCurrency": "1INCH",
                //     "quoteCurrency": "USD",
                //     "underlying": null,
                //     "restricted": false,
                //     "highLeverageFeeExempt": true,
                //     "change1h": -0.005912197576418299,
                //     "change24h": -0.013728263582660787,
                //     "changeBod": 0.018997679016590732,
                //     "quoteVolume24h": 2622864.2558,
                //     "volumeUsd24h": 2622864.2558
                // },

                return new BaseSymbol("FTX", obj.baseCurrency, obj.quoteCurrency)
            } else {
                return null
            }
        } else {

            //TODO: handle FUTURES, stocks?

            return null
        }
    }
    return fetchAndTransform("https://ftx.com/api/markets", "result", transformer)

}

export const fetchBinanceFutures = async (): Promise<IBaseSymbol[]> => {
    const transformer = (obj) => {
        if (obj.status === "TRADING") {
            return new BaseSymbol("BINANCEFUTURES", obj.baseAsset, obj.quoteAsset,
                `BINANCE:${obj.baseAsset}${obj.quoteAsset}PERP`)
        } else {
            // logJson(obj, "Binance Futures Discarded:")
            return null
        }
    }
    return fetchAndTransform("https://fapi.binance.com/fapi/v1/exchangeInfo", "symbols", transformer)
}

export const fetchBinance = async (isUs: boolean): Promise<IBaseSymbol[]> => {

    const exchange = isUs ? "BINANCEUS" : "BINANCE"

    const url = isUs ? "https://api.binance.us/api/v3/exchangeInfo" : "https://api.binance.com/api/v3/exchangeInfo";

    const transformer = (obj) => {
        if (obj.status === "TRADING") {
            return new BaseSymbol(exchange, obj.baseAsset, obj.quoteAsset)
        } else {
            // logJson(obj, `${exchange} Discarded`)
            return null
        }
    }
    return fetchAndTransform(url, "symbols", transformer)
}


export const fetchOkex = async (): Promise<IBaseSymbol[]> => {

    const transformer = (obj) => {
        return new BaseSymbol("OKEX", obj.base_currency, obj.quote_currency)
    }
    return fetchAndTransform("https://www.okex.com/api/spot/v3/instruments", null, transformer)
}


export const fetchSymbolsForSource = async (source: string): Promise<IBaseSymbol[]> => {

    let symbolArray: IBaseSymbol[];

    switch (source) {
        case BINANCEFUTURES:
            symbolArray = await fetchBinanceFutures()
            break;
        case BINANCE:
            symbolArray = await fetchBinance(false)
            break;
        case BINANCEUS:
            symbolArray = await fetchBinance(true)
            break;
        case FTX:
            symbolArray = await fetchFtx()
            break;
        case COINBASE:
            symbolArray = await fetchCoinbase()
            break;
        case BITTREX:
            symbolArray = await fetchBittrex()
            break;
        case KRAKEN:
            symbolArray = await fetchKraken()
            break;
        case KUCOIN:
            symbolArray = await fetchKucoin()
            break;
        case OKEX:
            symbolArray = await fetchOkex()
            break;
        case BYBIT:
            symbolArray = await fetchByBit()
            break;

        //let's not add until ByBit spot is available in tradingview
        // case BYBIT_SPOT:
        //     symbolArray = await fetchByBitSpot()
        //     break;
        default:
            console.error("No source exists: ", source)
            break;
    }
    return symbolArray
}
