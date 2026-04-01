let BASE_URL = "https://goctruyentranhvui21.com"
let TOKEN = ""
try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
    if (CONFIG_TOKEN) {
        TOKEN = CONFIG_TOKEN;
    }
} catch (error) {
}



const USER_AGENT = "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0"