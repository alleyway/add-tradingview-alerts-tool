export const delay = (time) => {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}
