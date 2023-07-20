import fs from "fs";
import { fetchSymbolsForSource } from "./service/exchange-service.js";
import { writeToStream } from "fast-csv";
import log from "./service/log.js";
import { Classification } from "./interfaces.js";
import kleur from "kleur";
const write = (stream, rows, options) => {
    return new Promise((res, rej) => {
        writeToStream(stream, rows, options)
            .on('error', (err) => rej(err))
            .on('finish', () => res());
    });
};
export const fetchSymbolsMain = async (source, quoteAssetFilter, classificationFilter) => {
    const formattedExchange = source.toLowerCase();
    let baseSymbols = await fetchSymbolsForSource(formattedExchange);
    const breakdown = baseSymbols.reduce((acc, symbol) => {
        if (typeof acc[symbol.classification] !== "undefined") {
            acc[symbol.classification] += 1;
        }
        else {
            acc[symbol.classification] = 1;
        }
        return acc;
    }, {});
    log.info("Parsed symbols classification breakdown:");
    for (const key of Object.keys(Classification)) {
        log.info(`    ${key}: ${breakdown[key] || 0}`);
    }
    if (quoteAssetFilter) {
        baseSymbols = baseSymbols.filter((sym) => sym.quoteAsset.toLowerCase() === quoteAssetFilter.toLowerCase());
    }
    if (classificationFilter) {
        baseSymbols = baseSymbols.filter((sym) => sym.classification.toLowerCase() === classificationFilter.toLowerCase());
    }
    if (!baseSymbols || baseSymbols.length == 0) {
        throw new Error("No symbols fetched or match filters!");
    }
    const rows = baseSymbols.map((baseSymbol) => {
        return {
            symbol: baseSymbol.id,
            instrument: baseSymbol.instrument,
            quote_asset: baseSymbol.quoteAsset,
            alert_name: ""
        };
    });
    const outputPath = `${formattedExchange}${classificationFilter ? "_" + classificationFilter.toLowerCase() : ""}${quoteAssetFilter ? "_" + quoteAssetFilter.toLowerCase() : ""}_symbols.csv`;
    const outStream = fs.createWriteStream(outputPath);
    await write(outStream, rows, { headers: true });
    log.success(`Wrote ${rows.length} rows to: ${kleur.blue(outputPath)}`);
};
//# sourceMappingURL=fetch-symbols.js.map