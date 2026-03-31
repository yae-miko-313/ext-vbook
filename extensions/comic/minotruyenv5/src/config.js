let BASE_URL = 'https://minotruyenv5.xyz';
let API = 'https://api.cloudkk.art/api';
let TYPE = 'comics';
try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}
try {
    if (CONFIG_TYPE) {
        TYPE = CONFIG_TYPE;
    }
} catch (error) {
}
let FULL_URL = BASE_URL + "/" + TYPE;
