export const soundNames = ["Thin", "3 Notes Reverb", "Alarm Clock", "Beep-beep", "Calling", "Chirpy", "Fault", "Hand Bell"];
export const isSoundName = (string) => {
    return typeof string === 'string' && soundNames.includes(string);
};
export const soundDurations = ["Once", "5 seconds", "10 seconds", "30 seconds", "Minute"];
export const isSoundDuration = (string) => {
    return typeof string === 'string' && soundDurations.includes(string);
};
export var Classification;
(function (Classification) {
    Classification["SPOT"] = "SPOT";
    Classification["LEVERAGED_TOKEN"] = "LEVERAGED_TOKEN";
    Classification["FUTURES_PERPETUAL"] = "FUTURES_PERPETUAL";
    Classification["FUTURES_DATED"] = "FUTURES_DATED";
})(Classification || (Classification = {}));
//# sourceMappingURL=interfaces.js.map