import fetch from "node-fetch"
import * as csv from 'fast-csv';
import * as fs from "fs";

const QUOTE_ASSET = process.argv[2]


const main = async () => {

    if (!QUOTE_ASSET) {
        console.error("You must specify a quote symbol, eg: npm run fetch:binance eth")
        process.exit(1)
    }

    const outStream = fs.createWriteStream(`ftx_${QUOTE_ASSET}_pairs.csv`)

    const csvStream = csv.format({headers: true});

    csvStream.pipe(outStream)
        .on('end', () => process.exit());

    try {

        const resp = await fetch("https://ftx.com/api/markets")

        const responseObject = await resp.json()

        const symbols = responseObject.result

        for (const symbol of symbols) {
            if (symbol.enabled && symbol.quoteCurrency === QUOTE_ASSET.toUpperCase()) {

                csvStream.write({
                    symbol: `FTX:${symbol.baseCurrency}${symbol.quoteCurrency}`,
                    quote: symbol.quoteCurrency,
                    base: symbol.baseCurrency,
                    name: ""
                });
            } else if (QUOTE_ASSET.toUpperCase() == "PERP" && symbol.enabled && symbol.name.endsWith("PERP")) {
                csvStream.write({
                    symbol: `FTX:${symbol.underlying}PERP`,
                    quote: symbol.quoteCurrency || "USD",
                    base: symbol.baseCurrency || symbol.underlying,
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


