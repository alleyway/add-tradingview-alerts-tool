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

export class DropdownError extends Error {
    _configName: string;
    _pageUrl: string;
    _needle: string;
    _haystack: string[];

    constructor(needle: string, haystack: string[]) {
        super(`Unable to partial match '${needle}' in dropdown of following options:\n${haystack.join("\n")}`)
        Object.setPrototypeOf(this, DropdownError.prototype);
        this._needle = needle;
        this._haystack = haystack;
    }

}
