import fs from "fs";
import * as csv from "fast-csv";
import {fetchPairsForExchange} from "./service/exchange-service.js";


const main = async () => {

    const QUOTE_ASSET = process.argv[2]

    if (!QUOTE_ASSET) {
        console.error("You must specify a quote symbol, eg: npm run fetch:binance eth")
        process.exit(1)
    }

    const EXCHANGE = (process.env.EXCHANGE || "").toLowerCase()

    const csvSymbolArray = await fetchPairsForExchange(EXCHANGE, QUOTE_ASSET)

    if (!csvSymbolArray || csvSymbolArray.length == 0) {
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
