import {IBaseSymbol, ClassificationType} from "./interfaces";

export class MasterSymbol implements IBaseSymbol {

    source: string;
    id: string;
    prefix: string;
    ticker: string;
    instrument: string;
    quoteAsset: string;
    classification: ClassificationType
    raw: object;

    constructor(
        raw: object,
        source: string,
        instrument: string,
        quoteAsset: string,
        id?: string,
        classification?: ClassificationType) {
        this.raw = raw
        this.id = id || `${source.toUpperCase()}:${instrument}${quoteAsset}`
        const [prefix, ticker] = this.id.split(":")
        this.prefix = prefix
        this.ticker = ticker
        this.source = source.toUpperCase();
        this.quoteAsset = quoteAsset;
        this.instrument = instrument;
        this.classification = classification || "SPOT"
    }
}

export class NoInputFoundError extends Error {

    constructor(message: string) {
        super(message);
    }
}

export class SelectionError extends Error {
    public _configName: string;
    public _pageUrl: string;
    _needle: string;
    _haystack: string[];

    constructor(needle: string, haystack: string[]) {
        super(`Unable to partial match '${needle}' from the following options:\n${haystack.join("\n")}`)
        Object.setPrototypeOf(this, SelectionError.prototype);
        this._needle = needle;
        this._haystack = haystack;
    }


    set configName(value: string) {
        this._configName = value;
    }

    set pageUrl(value: string) {
        this._pageUrl = value;
    }
}
