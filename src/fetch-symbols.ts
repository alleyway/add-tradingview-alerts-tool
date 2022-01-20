import fs from "fs";
import * as csv from "fast-csv";
import {fetchSymbolsForSource} from "./service/exchange-service";


const fetchSymbolsMain = async (source, quote) => {

    const formattedExchange = source.toLowerCase()

    let baseSymbols = await fetchSymbolsForSource(formattedExchange)

    if (quote) {
        baseSymbols = baseSymbols.filter((sym) => sym.quoteAsset.toLocaleLowerCase() === quote.toLowerCase())
    }

    if (!baseSymbols || baseSymbols.length == 0) {
        console.error("No symbols fetched!")
        process.exit(1)
    }

    const outputPath = `${formattedExchange}_${quote}_symbols.csv`;
    const outStream = fs.createWriteStream(outputPath)

    const csvStream = csv.format({headers: true});

    let numSymbols = 0

    csvStream.pipe(outStream)
        .on('end', () => {
            process.exit()
        });

    for (const baseSymbol of baseSymbols) {
        csvStream.write({
            symbol: baseSymbol.id,
            base: baseSymbol.baseAsset,
            quote: baseSymbol.quoteAsset,
            name: ""
        })
        numSymbols += 1
    }
    console.log(`Wrote ${numSymbols} rows to: ${outputPath}`)
    csvStream.end()
}

export default fetchSymbolsMain
