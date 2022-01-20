import { updateNotifier } from "./update-notifier";
describe('Update Notifier Tests', () => {
    it('updateNotifier()', async () => {
        const message = await updateNotifier("1.9.3");
        expect(message).toContain("version of atat available");
    });
});
//# sourceMappingURL=update-notifier.test.js.map