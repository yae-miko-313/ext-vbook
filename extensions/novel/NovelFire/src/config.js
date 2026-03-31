let BASE_URL = 'https://novelfire.net';
try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}
let tran_eng = 0
try {
    if (CONFIG_TRAN) {
        tran_eng = CONFIG_TRAN;
    }
} catch (error) {
}