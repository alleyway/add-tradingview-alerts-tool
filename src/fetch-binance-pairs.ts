import fetch from "node-fetch"

const QUOTE_ASSET = process.env.QUOTE_ASSET

const main = async () => {


    const resp = await fetch("https://api.binance.com/api/v3/exchangeInfo")

    const responseObject = await resp.json()

    const {symbols} = responseObject
    console.log("symbol,quote,base,name")
    // console.log(responseObject)
    for (const symbol of symbols){
        if (symbol.status === "TRADING" && symbol.quoteAsset === QUOTE_ASSET) {
            console.log(`BINANCE:${symbol.baseAsset}${symbol.quoteAsset},${symbol.quoteAsset},${symbol.baseAsset},`)
            }
    }

}


main().catch((error) => {
    console.error(error)
})


