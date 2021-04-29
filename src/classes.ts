import {IExchangeSymbol} from "./interfaces";


export class ExchangeSymbol implements IExchangeSymbol {

    id: string;
    exchange: string;
    quoteAsset: string;
    baseAsset: string;

    constructor(exchange: string, baseAsset: string, quoteAsset: string, id?: string) {
        this.id = id || `${exchange.toUpperCase()}:${baseAsset}${quoteAsset}`
        this.exchange = exchange;
        this.quoteAsset = quoteAsset;
        this.baseAsset = baseAsset;
    }
}

export class NoInputFoundError extends Error {

    constructor(message: string) {
        super(message);
    }
}
