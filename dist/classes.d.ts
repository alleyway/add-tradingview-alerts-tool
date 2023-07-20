import { IBaseSymbol, ClassificationType } from "./interfaces.js";
export declare class MasterSymbol implements IBaseSymbol {
    source: string;
    id: string;
    prefix: string;
    ticker: string;
    instrument: string;
    quoteAsset: string;
    classification: ClassificationType;
    raw: object;
    constructor(raw: object, source: string, instrument: string, quoteAsset: string, id?: string, classification?: ClassificationType);
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
export declare class InvalidSymbolError extends Error {
    symbol: string;
    constructor();
}
export declare class AddAlertInvocationError extends Error {
    constructor();
}
