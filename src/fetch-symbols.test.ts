import {fetchSymbolsMain} from "./fetch-symbols.js";
import {SOURCES_AVAILABLE} from "./service/exchange-service.js";
import fs from "fs";
import path from "path";
import { assert, describe, expect, it } from 'vitest'


describe('Fetch Symbols Test', () => {


    beforeAll(() => {
        console.log("current working directory: " + process.cwd())
    });

    it('fetchSymbolsMain()', async () => {

        const testSource = SOURCES_AVAILABLE[5];
        await fetchSymbolsMain(testSource)

        const filePath = path.join(process.cwd(),`${testSource}_symbols.csv` )

        console.log("reading file path: " + filePath)

        const fileContents = fs.readFileSync(filePath).toString();
        expect(fileContents).toContain("BTCUSD")

    });


})
