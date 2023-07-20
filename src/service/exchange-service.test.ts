import {
    fetchByBitInverse,
    fetchKucoin,
    fetchKraken,
    fetchBittrex,
    fetchCoinbase,
    fetchBinanceFuturesUsdM,
    fetchBinance,
    fetchOkxSpot,
    fetchByBitSpot,
    fetchBinanceFuturesCoinM,
    fetchKrakenFutures,
    fetchBitMex, fetchOkxSwap, fetchByBitLinear
} from "./exchange-service.js";
import {MasterSymbol} from "../classes.js";
import fs from "fs";
import path from "path";
import {isEnvEnabled} from "./common-service.js";


describe('Integrated Test of Exchanges', () => {

    const checkResults = (results: MasterSymbol[], minNumberExpecting: number) => {

        if (isEnvEnabled(process.env.TEST_SAVE_OUTPUT)) {
            const resWithoutRaw = results.map((val) => {delete val.raw; return val})
            fs.writeFileSync(path.join(process.cwd(), "output", results[0].source + "_out.json"), JSON.stringify(resWithoutRaw, null, 2), {encoding: "utf-8"})
        }

        expect(results.length).toBeGreaterThan(minNumberExpecting)
    }

    it('fetchBitMex()', async () => {
        const results = await fetchBitMex()
        checkResults(results, 30)
    });

    it('fetchByBitInverse()', async () => {
        const results = await fetchByBitInverse()
        checkResults(results, 10)
    });

    it('fetchByBitLinear()', async () => {
        const results = await fetchByBitLinear()
        checkResults(results, 220)
    });

    it('fetchByBitSpot()', async () => {
        const results = await fetchByBitSpot()
        checkResults(results, 100)
    });

    it('fetchKucoin()', async () => {
        const results = await fetchKucoin()
        checkResults(results, 100)
    });

    it('fetchKraken()', async () => {
        const results = await fetchKraken()
        checkResults(results, 100)
    });

    it('fetchKrakenFutures()', async () => {
        const results = await fetchKrakenFutures()
        checkResults(results, 4)
    });

    it('fetchBittrex()', async () => {
        const results = await fetchBittrex()
        checkResults(results, 100)
    });

    it('fetchCoinbase()', async () => {
        const results = await fetchCoinbase()
        checkResults(results, 100)
    });

    // it('fetchFtx()', async () => {
    //     const results = await fetchFtx()
    //     checkResults(results, 100)
    // });

    it('fetchBinanceFuturesUsdM()', async () => {
        const results = await fetchBinanceFuturesUsdM()
        checkResults(results, 100)
    });

    it('fetchBinanceFuturesCoinM()', async () => {
        const results = await fetchBinanceFuturesCoinM()
        checkResults(results, 30)
    });

    it('fetchBinance(true) //BINANCEUS', async () => {
        const results = await fetchBinance(true)
        checkResults(results, 100)
    });

    it('fetchBinance(false) //BINANCE', async () => {
        const results = await fetchBinance(false)
        checkResults(results, 100)
    });

    it('fetchOkxSpt()', async () => {
        const results = await fetchOkxSpot()
        checkResults(results, 100)
    });

    it('fetchOkxSwap()', async () => {
        const results = await fetchOkxSwap()
        checkResults(results, 50)
    });

    // it('fetchOkxFutures()', async () => {
    //     const results = await fetchOkxFutures()
    //     checkResults(results, 50)
    // });


});


