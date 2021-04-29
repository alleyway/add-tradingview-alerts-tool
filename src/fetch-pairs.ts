import fs from "fs";
import * as csv from "fast-csv";
import {fetchPairsForExchange} from "./service/exchange-service.js";


const fetchPairsMain = async (exchange, quote) => {

    const formattedExchange = exchange.toLowerCase()

    const exchangeSymbols = await fetchPairsForExchange(formattedExchange, quote)

    if (!exchangeSymbols || exchangeSymbols.length == 0) {
        console.error("No symbols fetched!")
        process.exit(1)
    }

    const outputPath = `${formattedExchange}_${quote}_pairs.csv`;
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

export default fetchPairsMain
