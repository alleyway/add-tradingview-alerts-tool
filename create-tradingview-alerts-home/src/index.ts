#!/usr/bin/env node
import {readFile, writeFile, mkdir, access, chmod, rm} from 'fs/promises';
import path from "path"
import prompts from "prompts";
import kleur from "kleur";
import {execSync} from "child_process"
import os from "os"
import manifest from "./manifest.json" assert {"type": "json"}

// @ts-ignore
// const manifest = JSON.parse(await readFile(new URL('./manifest.json', import.meta.url)));

async function exists(path) {
    try {
        await access(path)
        return true
    } catch {
        return false
    }
}

const TRADINGVIEW_ALERTS_HOME = "tradingview-alerts-home"

const initializeMain = async () => {

    console.log(`${kleur.gray("@alleyway/create-tradingview-alerts-home..")} version: ${kleur.yellow(manifest.version)}`)

    const choices = [
        {
            title: "Initialize in sub-folder",
            description: `Will create a new directory called '${TRADINGVIEW_ALERTS_HOME}' at your current path`,
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
            console.log(`Created new directory, run ${kleur.green(`cd '${TRADINGVIEW_ALERTS_HOME}'`)} to enter that directory`)
        } else {
            console.error(kleur.red(`Directory ${dir} already exists...change to that directory and run this command again.`))
            process.exit(1)
        }

    } else if (response.dir === "current-dir") {
        dir = process.cwd()
    }

    const copyFile = async (from, to, overwrite = false, executable = false) => {

        const target = path.join(dir, to);

        if (!(await exists(target)) || overwrite) {
            console.info(`Adding file: ${kleur.green(to)}`)
            // @ts-ignore
            const data = await readFile(new URL(from, import.meta.url), {encoding: "utf-8"})
            await writeFile(target, data)
            if (executable) {
                await chmod(target, "755");
            }
        } else {
            console.warn(kleur.yellow(`file exists(or permissions error), not copying file: ${to}`))
        }
    }

    const packageLockPath = path.join(dir, "package-lock.json")
    if (await exists(packageLockPath)) {
        console.info("Found package-lock.json...")
        console.info("Deleting package-lock.json")
        await rm(packageLockPath)
    }

    const nodeModulesPath = path.join(dir, "node_modules")
    if (await exists(nodeModulesPath)) {
        console.info("Found 'node_modules' directory")
        console.info("Deleting 'node_modules' directory")
        await rm(nodeModulesPath, {force: true, recursive: true})
    }

    await copyFile("./init/HOWTO.txt", "HOWTO.txt")
    await copyFile("./init/blacklist.csv", "blacklist.csv")
    await copyFile("./init/config.init.yml", "config.yml")
    await copyFile("./init/package.json", "package.json", true)
    await copyFile("./init/atat", "atat", true, true)

    if (os.platform().toLowerCase() === "win32") {
        await copyFile("./init/atat.cmd", "atat.cmd", true, true)
        await copyFile("./init/atat.ps1", "atat.ps1", true, true)
    }


    try {
        console.info(kleur.cyan("Installing dependencies"))
        let command = "npm --loglevel=error"

        if (response.dir === "new-dir"){
            command += ` --prefix ./${TRADINGVIEW_ALERTS_HOME}`
        }
        command += " --no-package-lock update"
        execSync(command, {stdio: "inherit"})

        console.log(`${kleur.green("Initialization complete!")} Edit the newly created ${kleur.yellow("config.yml")} file!`)
    } catch (e) {
        console.error(e)
    }


}

initializeMain().then(() => {
    console.log("done")
})
