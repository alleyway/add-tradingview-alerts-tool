import program from "./program.js";
import { jest } from '@jest/globals';
describe('CLI Program Tests', () => {
    let mockExit = null;
    beforeEach(() => {
        // @ts-ignore
        mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
        });
    });
    beforeAll(() => {
        console.log("current working directory: " + process.cwd());
    });
    const runCLIWithArgs = async (argumentString) => {
        const args = argumentString?.split(" ");
        await program.parseAsync(args, { from: "user" });
    };
    it('test regular expression', async () => {
        const options = ["first", "second", "xSQ", "xSQ", "fifth"];
        const conditionToMatch = "xSQ[2]";
        const match = conditionToMatch.match(/(.*?)\[(\d+)\]$/);
        // if match is not null, then the number to look for should be match[2]
        expect(match).toBeDefined();
    });
    it('no command', async () => {
        await runCLIWithArgs(null);
        expect(mockExit).toHaveBeenCalledWith(1);
    });
    it('--version', async () => {
        await runCLIWithArgs("--version");
        expect(mockExit).toHaveBeenCalledWith(0);
    });
    it('fetch-symbols binance', async () => {
        await runCLIWithArgs("fetch-symbols binance");
    });
    it('fetch-symbols binance -q eth', async () => {
        await runCLIWithArgs("fetch-symbols binance -q eth");
    });
    // it('fetch-symbols ftx -l 4 -q usd --classification futures_dated', async () => {
    //     await runCLIWithArgs("fetch-symbols ftx -q usd --classification futures_dated")
    //
    // });
    //
    // it('fetch-symbols ftx -q blah --classification futures_dated', async () => {
    //     await runCLIWithArgs("fetch-symbols ftx -q blah --classification futures_dated")
    //
    // });
});
//# sourceMappingURL=program.test.js.map