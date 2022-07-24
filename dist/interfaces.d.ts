export declare const soundNames: readonly ["Thin", "3 Notes Reverb", "Alarm Clock", "Beep-beep", "Calling", "Chirpy", "Fault", "Hand Bell"];
export declare type SoundName = typeof soundNames[number];
export declare const isSoundName: (string: unknown) => string is "Thin" | "3 Notes Reverb" | "Alarm Clock" | "Beep-beep" | "Calling" | "Chirpy" | "Fault" | "Hand Bell";
export declare const soundDurations: readonly ["Once", "5 seconds", "10 seconds", "30 seconds", "Minute"];
export declare type SoundDuration = typeof soundDurations[number];
export declare const isSoundDuration: (string: unknown) => string is "Once" | "5 seconds" | "10 seconds" | "30 seconds" | "Minute";
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
        playSound?: {
            enabled: boolean;
            name: SoundName;
            duration: SoundDuration;
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
