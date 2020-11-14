import 'source-map-support/register'
import Binance from 'binance-api-node'

const QUOTE_ASSET = process.env.QUOTE_ASSET

const main = async () => {
  const client = Binance()
//  const time = await client.time()

  const exchangeInfo = await client.exchangeInfo()
  console.log("symbol,quote,base,name")
  // @ts-ignore
  exchangeInfo.symbols.map((symbol) => {
    if (symbol.status === "TRADING" && symbol.quoteAsset === QUOTE_ASSET) {
      console.log(`BINANCE:${symbol.baseAsset}${symbol.quoteAsset},${symbol.quoteAsset},${symbol.baseAsset},`)
    }
  })
}


main().catch((error) => {
  console.error(error)
})


