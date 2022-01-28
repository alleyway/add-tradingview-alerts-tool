export interface ISingleAlertSettings {
    condition: {
        primaryLeft?: string;
        primaryRight?: string;
        secondary?: string;
        tertiaryLeft?: string | number;
        tertiaryRight?: string | number;
        quaternaryLeft?: string | number;
        quaternaryRight?: string | number;
    };
    option?: string;
    actions?: {
        notifyOnApp?: boolean;
        showPopup?: boolean;
        sendEmail?: boolean;
        webhook?: {
            enabled: boolean;
            url: string;
        };
    };
    name?: string;
    message?: string;
}
export declare enum Classification {
    SPOT = "SPOT",
    LEVERAGED_TOKEN = "LEVERAGED_TOKEN",
    FUTURES_PERPETUAL = "FUTURES_PERPETUAL",
    FUTURES_DATED = "FUTURES_DATED"
}
export declare type ClassificationType = keyof typeof Classification;
export interface IBaseSymbol {
    source: string;
    id: string;
    prefix: string;
    ticker: string;
    quoteAsset: string;
    instrument: string;
    classification: ClassificationType;
}
