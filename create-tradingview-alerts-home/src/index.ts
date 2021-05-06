#!/usr/bin/env node
import {readFile, writeFile, mkdir, access} from 'fs/promises';
import path from "path"
import prompts from "prompts";
import kleur from "kleur";
import {execSync} from "child_process"

async function exists(path) {
    try {
        await access(path)
        return true
    } catch {
        return false
    }
}

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
        if (!(await exists(dir))) {
            await mkdir(dir)
            console.log(`Created new directory, run ${kleur.green('cd tradingview-alerts-home')} to enter that directory`)
        } else {
            console.error(kleur.red(`Directory ${dir} already exists. Exiting.`))
            process.exit(1)
        }

    } else if (response.dir === "current-dir") {
        dir = process.cwd()
    }

    const copyFile = async (from, to, overwrite = false) => {

        const target = path.join(dir, to);

        if (!(await exists(target)) || overwrite) {
            console.info(`Adding file: ${kleur.green(to)}`)
            // @ts-ignore
            const data = await readFile(new URL(from, import.meta.url), {encoding: "utf-8"})
            await writeFile(target, data)
        } else {
            console.warn(kleur.yellow(`file exists(or permissions error), not copying file: ${to}`))
        }
    }

    await copyFile("./init/HOWTO.txt", "HOWTO.txt")
    await copyFile("./init/blacklist.csv", "blacklist.csv")
    await copyFile("./init/config.init.yml", "config.yml")
    await copyFile("./init/package.json", "package.json", true)

    try {
        console.info(kleur.cyan("Installing dependencies"))
        execSync(`cd '${dir}' && npm install`, {stdio: "inherit"})

        console.log(`${kleur.green("Initialization complete!")} Edit the newly created ${kleur.yellow("config.yml")} file!`)
    } catch (e) {
        console.error(e)
    }


}

initializeMain().then(() => {
    console.log("done")
})
