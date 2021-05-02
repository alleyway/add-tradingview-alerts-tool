import { IExchangeSymbol } from "../interfaces.js";
export declare const exchangesAvailable: string[];
export declare const fetchPairsForExchange: (exchange: string, quoteAsset?: string) => Promise<IExchangeSymbol[]>;
