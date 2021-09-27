import {IExchangeSymbol} from "../interfaces.js";
import fetch from "node-fetch"
import {ExchangeSymbol} from "../classes.js";

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

export const exchangesAvailable = [BINANCEFUTURES, BINANCE, BINANCEUS, BITTREX, COINBASE, FTX, KRAKEN, KUCOIN, OKEX, BYBIT]

const CONST_ALL = "all"


const fetchByBit = async(quoteAsset: string): Promise<IExchangeSymbol[]> => {
    const resp = await fetch("https://api.bybit.com/v2/public/symbols")

    const responseObject = await resp.json()

    // @ts-ignore
    const symbols = responseObject.result

    const exchangeSymbols: IExchangeSymbol[] = []

    for (const symbol of symbols) {

        if (symbol.status === "Trading" && (quoteAsset === CONST_ALL || symbol.quote_currency === quoteAsset.toUpperCase())) {
            exchangeSymbols.push(
                new ExchangeSymbol("BYBIT", symbol.base_currency, symbol.quote_currency,
                    `BYBIT:${symbol.alias}`)
            )
        }
    }
    return exchangeSymbols
}

const fetchKucoin = async (quoteAsset: string): Promise<IExchangeSymbol[]> => {
    const resp = await fetch("https://api.kucoin.com/api/v1/symbols")

    const responseObject = await resp.json()

    // @ts-ignore
    const symbolArray = responseObject.data

    const exchangeSymbols: IExchangeSymbol[] = []

    for (const symObj of symbolArray) { // key = "AAVEAUD"
        /*
            {
              "symbol": "REQ-ETH",
              "name": "REQ-ETH",
              "baseCurrency": "REQ",
              "quoteCurrency": "ETH",
              "feeCurrency": "ETH",
              "market": "ALTS",
              "baseMinSize": "1",
              "quoteMinSize": "0.0001",
              "baseMaxSize": "10000000000",
              "quoteMaxSize": "99999999",
              "baseIncrement": "0.0001",
              "quoteIncrement": "0.0000001",
              "priceIncrement": "0.0000001",
              "priceLimitRate": "0.1",
              "isMarginEnabled": false,
              "enableTrading": true
            },
         */
        const symbolBase = symObj.baseCurrency
        const symbolQuote = symObj.quoteCurrency

        if (symObj.enableTrading && (quoteAsset === CONST_ALL || symbolQuote === quoteAsset.toUpperCase())) {
            exchangeSymbols.push(
                new ExchangeSymbol("KUCOIN", symbolBase, symbolQuote)
            )
        }
    }
    return exchangeSymbols
}

const fetchKraken = async (quoteAsset: string): Promise<IExchangeSymbol[]> => {
    const resp = await fetch("https://api.kraken.com/0/public/AssetPairs")

    const responseObject = await resp.json()

    // @ts-ignore
    const symbolsObject = responseObject.result

    const exchangeSymbols: IExchangeSymbol[] = []

    for (const key of Object.keys(symbolsObject)) { // key = "AAVEAUD"

        const symbolObj = symbolsObject[key]

        if (symbolObj.wsname) {
            const [symbolBase, symbolQuote] = symbolObj.wsname.split("\/") // "AAVE\/AUD"

            if ((quoteAsset === CONST_ALL || symbolQuote === quoteAsset.toUpperCase())) {
                exchangeSymbols.push(
                    new ExchangeSymbol("KRAKEN", symbolBase, symbolQuote)
                )
            }
        } else {
            // some results are strange things like "ETHCAD.d"
        }
    }
    return exchangeSymbols
}

const fetchBittrex = async (quoteAsset: string): Promise<IExchangeSymbol[]> => {
    const resp = await fetch("https://api.bittrex.com/api/v1.1/public/getmarkets")

    const responseObject = await resp.json()

    // @ts-ignore
    const symbols = responseObject.result

    const exchangeSymbols: IExchangeSymbol[] = []

    for (const symbol of symbols) {

        if (symbol.IsActive && (quoteAsset === CONST_ALL || symbol.BaseCurrency === quoteAsset.toUpperCase())) {
            exchangeSymbols.push(
                new ExchangeSymbol("BITTREX", symbol.MarketCurrency, symbol.BaseCurrency)
            )
        }
    }
    return exchangeSymbols
}

const fetchCoinbase = async (quoteAsset: string): Promise<IExchangeSymbol[]> => {
    const resp = await fetch("https://api.pro.coinbase.com/products")

    const responseObject = await resp.json()

    const symbols = responseObject

    const exchangeSymbols: IExchangeSymbol[] = []

    // @ts-ignore
    for (const symbol of symbols) {

        if (!symbol.trading_disabled && symbol.status == "online" &&
            (quoteAsset === CONST_ALL || symbol.quote_currency === quoteAsset.toUpperCase())) {

            exchangeSymbols.push(
                new ExchangeSymbol("COINBASE", symbol.base_currency, symbol.quote_currency)
            )
        }
    }
    return exchangeSymbols
}


const fetchFtx = async (quoteAsset: string): Promise<IExchangeSymbol[]> => {

    const resp = await fetch("https://ftx.com/api/markets")

    const responseObject = await resp.json()

    // @ts-ignore
    const symbols = responseObject.result

    const exchangeSymbols: IExchangeSymbol[] = []

    for (const symbol of symbols) {
        if (symbol.enabled &&
            (quoteAsset === CONST_ALL || symbol.quoteCurrency === quoteAsset.toUpperCase())
            && symbol.quoteCurrency && symbol.baseCurrency
        ) {

            exchangeSymbols.push(
                new ExchangeSymbol("FTX", symbol.baseCurrency, symbol.quoteCurrency)
            )

        } else if (quoteAsset.toUpperCase() == "PERP" && symbol.enabled && symbol.name.endsWith("PERP")) {

            exchangeSymbols.push(
                {
                    exchange: "FTX",
                    id: `FTX:${symbol.underlying}PERP`,
                    baseAsset: symbol.baseCurrency || symbol.underlying,
                    quoteAsset: symbol.quoteCurrency || "USD",
                }
            )
        }
    }

    return exchangeSymbols
}

const fetchBinanceFutures = async (quoteAsset: string): Promise<IExchangeSymbol[]> => {

    const url = "https://fapi.binance.com/fapi/v1/exchangeInfo";

    const resp = await fetch(url)

    const responseObject = await resp.json()

    // @ts-ignore
    const {symbols} = responseObject

    const exchangeSymbols: IExchangeSymbol[] = []

    const exchange = "BINANCE"

    for (const symbol of symbols) {
        if (symbol.status === "TRADING" && (quoteAsset === CONST_ALL || symbol.quoteAsset === quoteAsset.toUpperCase())) {
            exchangeSymbols.push(
                new ExchangeSymbol(exchange, symbol.baseAsset, symbol.quoteAsset,
                    `${exchange.toUpperCase()}:${symbol.baseAsset}${symbol.quoteAsset}PERP`)
            )
        }
    }

    return exchangeSymbols
}

const fetchBinance = async (isUs: boolean, quoteAsset: string): Promise<IExchangeSymbol[]> => {

    const url = isUs ? "https://api.binance.us/api/v3/exchangeInfo" : "https://api.binance.com/api/v3/exchangeInfo";

    const resp = await fetch(url)

    const responseObject = await resp.json()

    // @ts-ignore
    const {symbols} = responseObject

    const exchangeSymbols: IExchangeSymbol[] = []

    const exchange = isUs ? "BINANCEUS" : "BINANCE"

    for (const symbol of symbols) {
        if (symbol.status === "TRADING" && (quoteAsset === CONST_ALL || symbol.quoteAsset === quoteAsset.toUpperCase())) {

            exchangeSymbols.push(
                new ExchangeSymbol(exchange, symbol.baseAsset, symbol.quoteAsset)
            )

        }
    }

    return exchangeSymbols
}


const fetchOkex = async (quoteAsset: string): Promise<IExchangeSymbol[]> => {

    const url = "https://www.okex.com/api/spot/v3/instruments"

    const resp = await fetch(url)

    const responseObject = await resp.json()

    const symbols = responseObject

    const exchangeSymbols: IExchangeSymbol[] = []

    const exchange = "OKEX"

    // @ts-ignore
    for (const symbol of symbols) {
        if ((quoteAsset === CONST_ALL || symbol.quote_currency === quoteAsset.toUpperCase())) {

            exchangeSymbols.push(
                new ExchangeSymbol(exchange, symbol.base_currency, symbol.quote_currency)
            )

        }
    }

    return exchangeSymbols
}





export const fetchPairsForExchange = async (exchange: string, quoteAsset: string = CONST_ALL): Promise<IExchangeSymbol[]> => {

    let symbolArray: IExchangeSymbol[];

    switch (exchange) {
        case BINANCEFUTURES:
            symbolArray = await fetchBinanceFutures(quoteAsset)
            break;
        case BINANCE:
            symbolArray = await fetchBinance(false, quoteAsset)
            break;
        case BINANCEUS:
            symbolArray = await fetchBinance(true, quoteAsset)
            break;
        case FTX:
            symbolArray = await fetchFtx(quoteAsset)
            break;
        case COINBASE:
            symbolArray = await fetchCoinbase(quoteAsset)
            break;
        case BITTREX:
            symbolArray = await fetchBittrex(quoteAsset)
            break;
        case KRAKEN:
            symbolArray = await fetchKraken(quoteAsset)
            break;
        case KUCOIN:
            symbolArray = await fetchKucoin(quoteAsset)
            break;
        case OKEX:
            symbolArray = await fetchOkex(quoteAsset)
            break;
        case BYBIT:
            symbolArray = await fetchByBit(quoteAsset)
            break;
        default:
            console.error("No exchange exists: ", exchange)
            break;
    }
    return symbolArray
}
