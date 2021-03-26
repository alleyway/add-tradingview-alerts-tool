import {IExchangeSymbol} from "./interfaces";


export class ExchangeSymbol implements IExchangeSymbol {

    id: string;
    exchange: string;
    quoteAsset: string;
    baseAsset: string;

    constructor(exchange: string, baseAsset: string, quoteAsset: string) {
        this.id = `${exchange.toUpperCase()}:${baseAsset}${quoteAsset}`
        this.exchange = exchange;
        this.quoteAsset = quoteAsset;
        this.baseAsset = baseAsset;
    }
}
