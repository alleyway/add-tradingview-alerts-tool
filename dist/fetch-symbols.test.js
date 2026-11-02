import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { fetchSymbolsMain } from "./fetch-symbols.js";
import { SOURCES_AVAILABLE } from "./service/exchange-service.js";
describe("Fetch Symbols Test", () => {
    beforeAll(() => {
        console.log(`current working directory: ${process.cwd()}`);
    });
    it("fetchSymbolsMain()", async () => {
        const testSource = SOURCES_AVAILABLE[4];
        await fetchSymbolsMain(testSource);
        const filePath = path.join(process.cwd(), `${testSource}_symbols.csv`);
        console.log(`reading file path: ${filePath}`);
        const fileContents = fs.readFileSync(filePath).toString();
        expect(fileContents).toContain("BTCUSD");
    });
});
//# sourceMappingURL=fetch-symbols.test.js.map