let BASE_URL = "https://omegascans.org";
let BASE_API = "https://api.omegascans.org";

try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}