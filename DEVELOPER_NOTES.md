## Developer Notes

To stop opening old pages:

    chrome://settings/onStartup



### Publishing

#### Beta Testing

Create a beta release:

    pnpm run release-beta

Ask a user to run the following:

    pnpm add @alleyway/add-tradingview-alerts-tool@beta

When release is made, ask user to return to stable:

    pnpm add @alleyway/add-tradingview-alerts-tool@latest

#### Stable Release
    ./deploy_master.sh
    pnpm run release


#### Stable Release (create-tradingview-alerts-home)

    create-tradingview-alerts-home $ pnpm run release
