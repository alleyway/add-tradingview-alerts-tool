import { IExchangeSymbol } from "../interfaces.js";
export declare const fetchPairsForExchange: (exchange: string, quoteAsset?: string) => Promise<IExchangeSymbol[]>;
