## Developer Notes

### Publishing

#### Beta Testing

Create a beta release:

    npm run release-beta

Ask a user to run the following:

    npm install @alleyway/add-tradingview-alerts-tool@beta

When release is made, ask user to return to stable:

    npm install @alleyway/add-tradingview-alerts-tool@latest

#### Stable Release
    ./deploy_master.sh
    npm run release


#### Stable Release (create-tradingview-alerts-home)

    create-tradingview-alerts-home $ npm run release
