import {fetchSymbolsMain} from "./fetch-symbols";
import {sourcesAvailable} from "./service/exchange-service";
import * as fs from "fs";


describe('Fetch Symbols Test', () => {


    // beforeAll(() => {
    //     console.log("remove files")
    // });

    it('fetchSymbolsMain()', async () => {

        const testSource = sourcesAvailable[0];
        await fetchSymbolsMain(testSource)

        const fileContents = fs.readFileSync(`${testSource}_symbols.csv`).toString();
        expect(fileContents).toContain("BTCUSD")

    });


})
