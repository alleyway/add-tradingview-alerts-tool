import fetch from "node-fetch"
import * as csv from 'fast-csv';
import * as fs from "fs";

const QUOTE_ASSET = process.argv[2]

const EXCHANGE = process.env.EXCHANGE

const main = async () => {

    if (!QUOTE_ASSET) {
        console.error("You must specify a quote symbol, eg: npm run fetch:ftx eth")
        process.exit(1)
    }

    const outStream = fs.createWriteStream(`${EXCHANGE.toLowerCase()}_${QUOTE_ASSET}_pairs.csv`)

    const csvStream = csv.format({headers: true});

    csvStream.pipe(outStream)
        .on('end', () => process.exit());

    try {

        const url = EXCHANGE == "BINANCEUS" ? "https://api.binance.us/api/v3/exchangeInfo" : "https://api.binance.com/api/v3/exchangeInfo";

        const resp = await fetch(url)

        const responseObject = await resp.json()

        const {symbols} = responseObject

        for (const symbol of symbols) {
            if (symbol.status === "TRADING" && symbol.quoteAsset === QUOTE_ASSET.toUpperCase()) {

                csvStream.write({
                    symbol: `${EXCHANGE}:${symbol.baseAsset}${symbol.quoteAsset}`,
                    quote: symbol.quoteAsset,
                    base: symbol.baseAsset,
                    name: ""
                });
            }
        }

    } catch (e) {
        console.error(e)
    } finally {
        csvStream.end();
    }
}


main().catch((error) => {
    console.error(error)
})


