export class ExchangeSymbol {
    constructor(exchange, baseAsset, quoteAsset, id) {
        this.id = id || `${exchange.toUpperCase()}:${baseAsset}${quoteAsset}`;
        this.exchange = exchange;
        this.quoteAsset = quoteAsset;
        this.baseAsset = baseAsset;
    }
}
export class NoInputFoundError extends Error {
    constructor(message) {
        super(message);
    }
}
//# sourceMappingURL=classes.js.map