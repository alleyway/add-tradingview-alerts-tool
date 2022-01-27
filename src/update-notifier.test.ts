
import {updateNotifier} from "./update-notifier";

describe('Update Notifier Tests', () => {

    it('updateNotifier() - latest', async () => {
        const message = await updateNotifier("1.9.3")
        console.log(message)
        expect(message).toContain("version of atat available");
    });

    it('updateNotifier() - beta', async () => {
        const message = await updateNotifier("1.9.5-beta.0")
        console.log(message)
        expect(message).toContain("version of atat available");
    });

    it('updateNotifier() - ci', async () => {
        const message = await updateNotifier("1.9.5-ci.111.0")
        console.log(message)
        expect(message).toContain("version of atat available");
    });


})
