import { fetchSymbolsMain } from "./fetch-symbols";
import { SOURCES_AVAILABLE } from "./service/exchange-service";
import fs from "fs";
import path from "path";
describe('Fetch Symbols Test', () => {
    beforeAll(() => {
        console.log("current working directory: " + process.cwd());
    });
    it('fetchSymbolsMain()', async () => {
        const testSource = SOURCES_AVAILABLE[0];
        await fetchSymbolsMain(testSource);
        const filePath = path.join(process.cwd(), `${testSource}_symbols.csv`);
        console.log("reading file path: " + filePath);
        const fileContents = fs.readFileSync(filePath).toString();
        expect(fileContents).toContain("BTCUSD");
    });
});
//# sourceMappingURL=fetch-symbols.test.js.map