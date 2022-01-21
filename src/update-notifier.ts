

// shamelessly copied from npm's cli source code


// print a banner telling the user to upgrade npm to latest
// but not in CI, and not if we're doing that already.
// Check daily for betas, and weekly otherwise.
import pacote from "pacote"
import semver from "semver"
import kleur from "kleur";


export const updateNotifier =  async (version, spec = 'latest') => {
    // never check for updates in CI, when updating npm already, or opted out

    // if (!npm.config.get('update-notifier') || isGlobalNpmUpdate(npm))
    //     return null

    // if we're on a prerelease train, then updates are coming fast
    // check for a new one daily.  otherwise, weekly.
    // const { version } = npm
    const current = semver.parse(version)

    // if we're on a beta train, always get the next beta
    if (current.prerelease.length)
        spec = `^${version}`

    // while on a beta train, get updates daily
    // const duration = spec !== 'latest' ? DAILY : WEEKLY

    // if we've already checked within the specified duration, don't check again
    // if (!(await updateTimeout( duration)))
    //     return null

    // if they're currently using a prerelease, nudge to the next prerelease
    // otherwise, nudge to latest.
    const useColor = true

    const mani = await pacote.manifest(`@alleyway/add-tradingview-alerts-tool@${spec}`, {
        // always prefer latest, even if doing --tag=whatever on the cmd
        defaultTag: 'latest',
    }).catch(() => null)

    // if pacote failed, give up
    if (!mani)
        return null

    const latest = mani.version

    // if the current version is *greater* than latest, we're on a 'next'
    // and should get the updates from that release train.
    // Note that this isn't another http request over the network, because
    // the packument will be cached by pacote from previous request.

    // if (semver.gt(version, latest) && spec === 'latest')
    //     return updateNotifier( `^${version}`)

    // if we already have something >= the desired spec, then we're done
    if (semver.gte(version, latest))
        return null

    // ok!  notify the user about this update they should get.
    // The message is saved for printing at process exit so it will not get
    // lost in any other messages being printed as part of the command.
    const update = semver.parse(mani.version)
    const type = update.major !== current.major ? 'major'
        : update.minor !== current.minor ? 'minor'
            : update.patch !== current.patch ? 'patch'
                : 'prerelease'
    const typec = !useColor ? type
        : type === 'major' ? kleur.red(type)
            : type === 'minor' ? kleur.yellow(type)
                : kleur.green(type)
    const oldc = !useColor ? current : kleur.red(current)
    const latestc = !useColor ? latest : kleur.green(latest)
    const changelog = `https://github.com/alleyway/add-tradingview-alerts-tool/releases/tag/v${latest}`
    const changelogc = !useColor ? `<${changelog}>` : kleur.cyan(changelog)
    const cmd = `npm install @alleyway/add-tradingview-alerts-tool@${latest}`
    const cmdc = !useColor ? `\`${cmd}\`` : kleur.green(cmd)
    const message = `\nNew ${typec} version of atat available! ` +
        `${oldc} -> ${latestc}\n` +
        `Changelog: ${changelogc}\n` +
        `Run ${cmdc} to update!\n`
    const messagec = !useColor ? message : kleur.bgBlack(message)

    return messagec
}
