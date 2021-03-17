import fetch from "node-fetch"
import {ICsvSymbol} from "./interfaces";
import fs from "fs";
import * as csv from "fast-csv";

//


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


const main = async () => {

    const QUOTE_ASSET = process.argv[2]

    if (!QUOTE_ASSET) {
        console.error("You must specify a quote symbol, eg: npm run fetch:binance eth")
        process.exit(1)
    }

    const EXCHANGE = (process.env.EXCHANGE || "").toLowerCase()

    let csvSymbolArray: ICsvSymbol[];

    switch (EXCHANGE) {
        case "binance":
            csvSymbolArray = await fetchBinance(false, QUOTE_ASSET)
            break;
        case "binanceus":
            csvSymbolArray = await fetchBinance(true, QUOTE_ASSET)
            break;
        case "ftx":
            csvSymbolArray = await fetchFtx(QUOTE_ASSET)
            break;
        case "coinbase":
            csvSymbolArray = await fetchCoinbase(QUOTE_ASSET)
            break;
        case "bittrex":
            csvSymbolArray = await fetchBittrex(QUOTE_ASSET)
            break;
        default:
            console.error("No exchange exists: ", EXCHANGE)
            break;
    }

    if (!csvSymbolArray || csvSymbolArray.length == 0){
        console.error("No symbols fetched!")
        process.exit(1)
    }

    const outputPath = `${EXCHANGE}_${QUOTE_ASSET}_pairs.csv`;
    const outStream = fs.createWriteStream(outputPath)

    const csvStream = csv.format({headers: true});

    let numPairs = 0

    csvStream.pipe(outStream)
        .on('end', () => {
            process.exit()
        });

    for (const csvSymbol of csvSymbolArray) {
        csvStream.write({
            symbol: csvSymbol.symbol,
            base: csvSymbol.base,
            quote: csvSymbol.quote,
            name: csvSymbol.name
        })
        numPairs += 1
    }
    console.log(`Wrote ${numPairs} rows to: ${outputPath}`)
    csvStream.end()
}


main().catch((error) => {
    console.error(error)
})
