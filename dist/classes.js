export class MasterSymbol {
    source;
    id;
    prefix;
    ticker;
    instrument;
    quoteAsset;
    classification;
    raw;
    constructor(raw, source, instrument, quoteAsset, id, classification) {
        this.raw = raw;
        this.id = id || `${source.toUpperCase()}:${instrument}${quoteAsset}`;
        const [prefix, ticker] = this.id.split(":");
        this.prefix = prefix;
        this.ticker = ticker;
        this.source = source.toUpperCase();
        this.quoteAsset = quoteAsset;
        this.instrument = instrument;
        this.classification = classification || "SPOT";
    }
}
export class NoInputFoundError extends Error {
    constructor(message) {
        super(message);
    }
}
export class SelectionError extends Error {
    _configName;
    _pageUrl;
    _needle;
    _haystack;
    constructor(needle, haystack) {
        super(`Unable to partial match '${needle}' from the following options:\n${haystack.join("\n")}`);
        Object.setPrototypeOf(this, SelectionError.prototype);
        this._needle = needle;
        this._haystack = haystack;
    }
    set configName(value) {
        this._configName = value;
    }
    set pageUrl(value) {
        this._pageUrl = value;
    }
}
export class InvalidSymbolError extends Error {
    symbol;
    constructor() {
        super(`Invalid Symbol`);
        Object.setPrototypeOf(this, InvalidSymbolError.prototype);
    }
}
export class AddAlertInvocationError extends Error {
    constructor() {
        super("Unable to bring up alert dialog (system error)");
        Object.setPrototypeOf(this, AddAlertInvocationError.prototype);
    }
}
export class ErrorWithScreenShot extends Error {
    filenameSearch;
    constructor(message, filenameSearch) {
        super(message);
        this.filenameSearch = filenameSearch;
        Object.setPrototypeOf(this, ErrorWithScreenShot.prototype);
    }
}
//# sourceMappingURL=classes.js.map