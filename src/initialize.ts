import log from "./service/log.js";
import {readFile, writeFile} from 'fs/promises';
import path from "path"

const initializeMain = async () => {

    log.info("initializeMain()")
    // @ts-ignore
    const howtoData = await readFile(new URL('./init/HOWTO.txt', import.meta.url), {encoding: "utf-8"})
    await writeFile(path.join(process.cwd(), "HOWTO.txt"), howtoData)

    // @ts-ignore
    const blacklistData = await readFile(new URL('./init/blacklist.csv', import.meta.url), {encoding: "utf-8"})
    await writeFile(path.join(process.cwd(), "blacklist.csv"), blacklistData)



}


export default initializeMain
