export interface ISingleAlertSettings {
    condition: {
        primaryLeft?: string,
        primaryRight?: string,
        secondary?: string,
        tertiaryLeft?: string | number,
        tertiaryRight?: string | number,
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

interface ICsvSymbol {
    symbol: string,
    quote: string,
    base: string
    name: string
}
