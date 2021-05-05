
## Developer Notes

Install [xpath generator](https://chrome.google.com/webstore/detail/xpath-generator/dphfifdfpfabhbkghlmnkkdghbmocfeb)


### Publishing

#### Beta Testing

Create a beta release:

    npm run release-beta

Ask a user to run the following:

    npm install @alleyway/add-tradingview-alerts-tool@beta

When release is made, ask user to return to stable:

    npm install @alleyway/add-tradingview-alerts-tool@latest

#### Stable Release
    npm run release
    ./deploy_master.sh


#### Stable Release (create-tradingview-alerts-home)

    create-tradingview-alerts-home$ npm publish
