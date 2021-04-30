import log from "./service/log.js";
import {readFile, writeFile, mkdir} from 'fs/promises';
import path from "path"
import prompts from "prompts";
import kleur from "kleur";

const initializeMain = async () => {

    const choices = [
        {
            title: "Initialize in sub-folder",
            description: "Will create a new directory called 'tradingview-alerts-home' at your current path",
            value: "new-dir"
        },
        {
            title: "Initialize in current folder",
            description: "You already made or have a directory and are running this command inside of it",
            value: "current-dir"
        },
        {
            value: "exit"
        }
    ]

    const response = await prompts([
        {
            type: "select",
            name: "dir",
            message: "Choose which action you'd like to do:",
            initial: 0,
            choices: choices,
        },
    ]);

    let dir = path.join(process.cwd(), "tradingview-alerts-home")

    if (response.dir === "exit") {
        process.exit(0)
    } else if (response.dir === "new-dir") {
        await mkdir(dir)
        log.info("Created new directory, type 'cd tradingview-alerts-home' to enter that directory")
    } else if (response.dir === "current-dir") {
        dir = process.cwd()
    }

    log.info(`Initialization complete! Edit the newly created ${kleur.yellow("config.yml")} file!`)

    // @ts-ignore
    const howtoData = await readFile(new URL('./init/HOWTO.txt', import.meta.url), {encoding: "utf-8"})
    await writeFile(path.join(dir, "HOWTO.txt"), howtoData)

    // @ts-ignore
    const blacklistData = await readFile(new URL('./init/blacklist.csv', import.meta.url), {encoding: "utf-8"})
    await writeFile(path.join(dir, "blacklist.csv"), blacklistData)


    // @ts-ignore
    const configData = await readFile(new URL('./init/config.init.yml', import.meta.url), {encoding: "utf-8"})
    await writeFile(path.join(dir, "config.yml"), configData)

}


export default initializeMain
