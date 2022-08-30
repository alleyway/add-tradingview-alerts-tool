
export const soundNames = ["Thin" , "3 Notes Reverb" , "Alarm Clock" , "Beep-beep" , "Calling" , "Chirpy" , "Fault" , "Hand Bell"] as const
export type SoundName =  typeof soundNames[number]
export const isSoundName = (string: unknown): string is SoundName => {
    return typeof string === 'string' && soundNames.includes(string as SoundName);
}

export const soundDurations = ["Once" , "5 seconds" , "10 seconds" , "30 seconds" , "Minute"] as const
export type SoundDuration = typeof soundDurations[number]
export const isSoundDuration = (string: unknown): string is SoundDuration => {
    return typeof string === 'string' && soundDurations.includes(string as SoundDuration);
}

export interface ISingleAlertSettings {
    condition: {
        primaryLeft?: string,
        primaryRight?: string,
        secondary?: string,
        tertiaryLeft?: string | number,
        tertiaryRight?: string | number,
        quaternaryLeft?: string | number,
        quaternaryRight?: string | number,
    }
    // option
    option?: string,

    expireOpenEnded?: boolean,
    expireInterval?: number,

    //expiration:
    actions?: {
        notifyOnApp?: boolean
        showPopup?: boolean
        sendEmail?: boolean
        webhook?: {
            enabled: boolean
            url: string
        }
        playSound?: {
            enabled: boolean
            name: SoundName
            duration: SoundDuration
        }
    }

    name?: string,
    message?: string
}

export enum Classification {SPOT = "SPOT" , LEVERAGED_TOKEN = 'LEVERAGED_TOKEN' , FUTURES_PERPETUAL = 'FUTURES_PERPETUAL' , FUTURES_DATED = 'FUTURES_DATED'}

export type ClassificationType = keyof typeof Classification;


// mostly following pine script docs for this
export interface IBaseSymbol {
    source: string,     // BINANCEFUTURES   or      FTX
    id: string,         // BINANCE:BTCUSDT  or      FTX:BTC0325   // tradingview symbol
    prefix: string,     // BINANCE          or      FTX
    ticker: string,     // BTCUSDT          or      BTC0325
    quoteAsset: string, // USDT             or      USD
    instrument: string,  // BTC              or      BTC0325
    classification: ClassificationType
}
