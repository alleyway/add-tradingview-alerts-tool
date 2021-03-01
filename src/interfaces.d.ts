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
    // TODO

    name?: string,
    message?: string
}
