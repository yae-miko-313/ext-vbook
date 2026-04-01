var BASE_URL = 'https://example.com';
var API_URL = 'https://api.example.com';

try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}
