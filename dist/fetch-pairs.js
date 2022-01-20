import fs from "fs";
import * as csv from "fast-csv";
import { fetchSymbolsForSource } from "./service/exchange-service.js";
const fetchSymbolsMain = async (exchange, quote) => {
    const formattedExchange = exchange.toLowerCase();
    const exchangeSymbols = await fetchSymbolsForSource(formattedExchange, quote);
    if (!exchangeSymbols || exchangeSymbols.length == 0) {
        console.error("No symbols fetched!");
        process.exit(1);
    }
    const outputPath = `${formattedExchange}_${quote}_symbols.csv`;
    const outStream = fs.createWriteStream(outputPath);
    const csvStream = csv.format({ headers: true });
    let numSymbols = 0;
    csvStream.pipe(outStream)
        .on('end', () => {
        process.exit();
    });
    for (const csvSymbol of exchangeSymbols) {
        csvStream.write({
            symbol: csvSymbol.id,
            base: csvSymbol.baseAsset,
            quote: csvSymbol.quoteAsset,
            name: ""
        });
        numSymbols += 1;
    }
    console.log(`Wrote ${numSymbols} rows to: ${outputPath}`);
    csvStream.end();
};
export default fetchSymbolsMain;
//# sourceMappingURL=fetch-pairs.js.map