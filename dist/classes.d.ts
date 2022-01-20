import { IBaseSymbol } from "./interfaces";
export declare class BaseSymbol implements IBaseSymbol {
    source: string;
    id: string;
    prefix: string;
    ticker: string;
    baseAsset: string;
    quoteAsset: string;
    constructor(source: string, baseAsset: string, quoteAsset: string, id?: string);
}
export declare class NoInputFoundError extends Error {
    constructor(message: string);
}
export declare class SelectionError extends Error {
    _configName: string;
    _pageUrl: string;
    _needle: string;
    _haystack: string[];
    constructor(needle: string, haystack: string[]);
    set configName(value: string);
    set pageUrl(value: string);
}
