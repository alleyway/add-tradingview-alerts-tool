import { IExchangeSymbol } from "./interfaces";
export declare class ExchangeSymbol implements IExchangeSymbol {
    id: string;
    exchange: string;
    quoteAsset: string;
    baseAsset: string;
    constructor(exchange: string, baseAsset: string, quoteAsset: string, id?: string);
}
export declare class NoInputFoundError extends Error {
    constructor(message: string);
}
export declare class DropdownError extends Error {
    _configName: string;
    _pageUrl: string;
    _needle: string;
    _haystack: string[];
    constructor(needle: string, haystack: string[]);
    set configName(value: string);
    set pageUrl(value: string);
}
