import {ICsvSymbol} from "../interfaces";
import fetch from "node-fetch"
const fetchBittrex = async (quoteAsset: string): Promise<ICsvSymbol[]> => {
    const resp = await fetch("https://api.bittrex.com/api/v1.1/public/getmarkets")

    const responseObject = await resp.json()

    const symbols = responseObject.result

    const csvSymbols: ICsvSymbol[] = []

    for (const symbol of symbols) {

        if (symbol.IsActive && symbol.BaseCurrency === quoteAsset.toUpperCase()) {

            csvSymbols.push({
                symbol: `BITTREX:${symbol.MarketCurrency}${symbol.BaseCurrency}`,
                base: symbol.MarketCurrency,
                quote: symbol.BaseCurrency,
                name: ""
            })
        }
    }

    return csvSymbols
}

const fetchCoinbase = async (quoteAsset: string): Promise<ICsvSymbol[]> => {
    const resp = await fetch("https://api.pro.coinbase.com/products")

    const responseObject = await resp.json()

    const symbols = responseObject

    const csvSymbols: ICsvSymbol[] = []

    for (const symbol of symbols) {

        if (!symbol.trading_disabled && symbol.status == "online" && symbol.quote_currency === quoteAsset.toUpperCase()) {

            csvSymbols.push({
                symbol: `COINBASE:${symbol.base_currency}${symbol.quote_currency}`,
                base: symbol.base_currency,
                quote: symbol.quote_currency,
                name: ""
            })
        }
    }

    return csvSymbols
}



const fetchFtx = async (quoteAsset: string): Promise<ICsvSymbol[]> => {

    const resp = await fetch("https://ftx.com/api/markets")

    const responseObject = await resp.json()

    const symbols = responseObject.result

    const csvSymbols: ICsvSymbol[] = []

    for (const symbol of symbols) {
        if (symbol.enabled && symbol.quoteCurrency === quoteAsset.toUpperCase()) {

            csvSymbols.push({
                symbol: `FTX:${symbol.baseCurrency}${symbol.quoteCurrency}`,
                base: symbol.baseCurrency,
                quote: symbol.quoteCurrency,
                name: ""
            })

        } else if (quoteAsset.toUpperCase() == "PERP" && symbol.enabled && symbol.name.endsWith("PERP")) {
            csvSymbols.push({
                symbol: `FTX:${symbol.underlying}PERP`,
                base: symbol.baseCurrency || symbol.underlying,
                quote: symbol.quoteCurrency || "USD",
                name: ""
            })
        }
    }

    return csvSymbols
}


const fetchBinance = async (isUs: boolean, quoteAsset: string): Promise<ICsvSymbol[]> => {

    const url = isUs ? "https://api.binance.us/api/v3/exchangeInfo" : "https://api.binance.com/api/v3/exchangeInfo";

    const resp = await fetch(url)

    const responseObject = await resp.json()

    const {symbols} = responseObject

    const csvSymbols: ICsvSymbol[] = []

    const exchange = isUs ? "BINANCEUS" : "BINANCE"

    for (const symbol of symbols) {
        if (symbol.status === "TRADING" && symbol.quoteAsset === quoteAsset.toUpperCase()) {

            csvSymbols.push({
                symbol: `${exchange}:${symbol.baseAsset}${symbol.quoteAsset}`,
                base: symbol.baseAsset,
                quote: symbol.quoteAsset,
                name: ""
            })
        }
    }

    return csvSymbols
}

export const fetchPairsForExchange = async (exchange: string, quoteAsset: string): Promise<ICsvSymbol[]> => {

    let csvSymbolArray: ICsvSymbol[];

    switch (exchange) {
        case "binance":
            csvSymbolArray = await fetchBinance(false, quoteAsset)
            break;
        case "binanceus":
            csvSymbolArray = await fetchBinance(true, quoteAsset)
            break;
        case "ftx":
            csvSymbolArray = await fetchFtx(quoteAsset)
            break;
        case "coinbase":
            csvSymbolArray = await fetchCoinbase(quoteAsset)
            break;
        case "bittrex":
            csvSymbolArray = await fetchBittrex(quoteAsset)
            break;
        default:
            console.error("No exchange exists: ", exchange)
            break;
    }
    return csvSymbolArray
}
