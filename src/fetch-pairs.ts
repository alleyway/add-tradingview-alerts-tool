import fs from "fs";
import * as csv from "fast-csv";
import {fetchPairsForExchange} from "./service/exchange-service";


const main = async () => {

    const QUOTE_ASSET = process.argv[2]

    if (!QUOTE_ASSET) {
        console.error("You must specify a quote symbol, eg: npm run fetch:binance eth")
        process.exit(1)
    }

    const EXCHANGE = (process.env.EXCHANGE || "").toLowerCase()

    const exchangeSymbols = await fetchPairsForExchange(EXCHANGE, QUOTE_ASSET)

    if (!exchangeSymbols || exchangeSymbols.length == 0) {
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

    for (const csvSymbol of exchangeSymbols) {
        csvStream.write({
            symbol: csvSymbol.id,
            base: csvSymbol.baseAsset,
            quote: csvSymbol.quoteAsset,
            name: ""
        })
        numPairs += 1
    }
    console.log(`Wrote ${numPairs} rows to: ${outputPath}`)
    csvStream.end()
}


main().catch((error) => {
    console.error(error)
})
