import {
    fetchByBit,
    fetchKucoin,
    fetchKraken,
    fetchBittrex,
    fetchCoinbase,
    fetchFtx,
    fetchBinanceFutures, fetchBinance, fetchOkex, fetchByBitSpot
} from "./exchange-service";


describe('Integrated Test of Exchanges', () => {

    it('fetchByBit()', async () => {
        const results = await fetchByBit()
        expect(results.length).toBeGreaterThan(100);
    });

    it('fetchByBitSpot()', async () => {
        const results = await fetchByBitSpot()
        expect(results.length).toBeGreaterThan(100);
    });


    it('fetchKucoin()', async () => {
        const results = await fetchKucoin()
        expect(results.length).toBeGreaterThan(100);
    });

    it('fetchKraken()', async () => {
        const results = await fetchKraken()
        expect(results.length).toBeGreaterThan(100);
    });

    it('fetchBittrex()', async () => {
        const results = await fetchBittrex()
        expect(results.length).toBeGreaterThan(100);
    });

    it('fetchCoinbase()', async () => {
        const results = await fetchCoinbase()
        expect(results.length).toBeGreaterThan(100);
    });

    it('fetchFtx()', async () => {
        const results = await fetchFtx()
        expect(results.length).toBeGreaterThan(100);
    });

    it('fetchBinanceFutures()', async () => {
        const results = await fetchBinanceFutures()
        expect(results.length).toBeGreaterThan(100);
    });

    it('fetchBinance(true) //BINANCEUS', async () => {
        const results = await fetchBinance(true)
        expect(results.length).toBeGreaterThan(100);
    });

    it('fetchBinance(false) // regular', async () => {
        const results = await fetchBinance(false)
        expect(results.length).toBeGreaterThan(100);
    });

    it('fetchOkex()', async () => {
        const results = await fetchOkex()
        expect(results.length).toBeGreaterThan(100);
    });



});


