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

    //expiration:
    actions?: {
        notifyOnApp?: boolean
        showPopup?: boolean
        sendEmail?: boolean
        webhook?: {
            enabled: boolean
            url: string
        }
    }

    name?: string,
    message?: string
}

export interface IExchangeSymbol {
    id: string,
    exchange: string,
    quoteAsset: string,
    baseAsset: string
}
