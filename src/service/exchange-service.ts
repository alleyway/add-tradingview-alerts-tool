import {IExchangeSymbol} from "../interfaces";
import fetch from "node-fetch"
import {ExchangeSymbol} from "../classes";


const CONST_ALL = "all"

const fetchBittrex = async (quoteAsset: string): Promise<IExchangeSymbol[]> => {
    const resp = await fetch("https://api.bittrex.com/api/v1.1/public/getmarkets")

    const responseObject = await resp.json()

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

export const fetchPairsForExchange = async (exchange: string, quoteAsset: string = CONST_ALL): Promise<IExchangeSymbol[]> => {

    let symbolArray: IExchangeSymbol[];

    switch (exchange) {
        case "binancefutures":
            symbolArray = await fetchBinanceFutures(quoteAsset)
            break;
        case "binance":
            symbolArray = await fetchBinance(false, quoteAsset)
            break;
        case "binanceus":
            symbolArray = await fetchBinance(true, quoteAsset)
            break;
        case "ftx":
            symbolArray = await fetchFtx(quoteAsset)
            break;
        case "coinbase":
            symbolArray = await fetchCoinbase(quoteAsset)
            break;
        case "bittrex":
            symbolArray = await fetchBittrex(quoteAsset)
            break;
        default:
            console.error("No exchange exists: ", exchange)
            break;
    }
    return symbolArray
}
