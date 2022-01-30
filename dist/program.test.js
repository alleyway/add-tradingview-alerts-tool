import program from "./program";
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
    it('fetch-symbols ftx -q usd --classification futures_dated', async () => {
        await runCLIWithArgs("fetch-symbols ftx -q usd --classification futures_dated");
    });
});
//# sourceMappingURL=program.test.js.map