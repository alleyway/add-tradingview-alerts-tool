import fs from "fs";
import { fetchSymbolsForSource } from "./service/exchange-service";
import { writeToStream } from "fast-csv";
const write = (stream, rows, options) => {
    return new Promise((res, rej) => {
        writeToStream(stream, rows, options)
            .on('error', (err) => rej(err))
            .on('finish', () => res());
    });
};
export const fetchSymbolsMain = async (source, quote) => {
    const formattedExchange = source.toLowerCase();
    let baseSymbols = await fetchSymbolsForSource(formattedExchange);
    if (quote) {
        baseSymbols = baseSymbols.filter((sym) => sym.quoteAsset.toLocaleLowerCase() === quote.toLowerCase());
    }
    if (!baseSymbols || baseSymbols.length == 0) {
        console.error("No symbols fetched!");
        process.exit(1);
    }
    const rows = baseSymbols.map((baseSymbol) => {
        return {
            symbol: baseSymbol.id,
            base: baseSymbol.baseAsset,
            quote: baseSymbol.quoteAsset,
            name: ""
        };
    });
    const outputPath = `${formattedExchange}${quote ? "_" + quote : ""}_symbols.csv`;
    const outStream = fs.createWriteStream(outputPath);
    await write(outStream, rows, { headers: true });
    console.log(`Wrote ${rows.length} rows to: ${outputPath}`);
};
//# sourceMappingURL=fetch-symbols.js.map