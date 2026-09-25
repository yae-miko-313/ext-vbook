let BASE_URL = "https://sachiepvien.net";
try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (error) {
}

function normalizeUrl(url) {
    return url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
}

// Archive urls (/category/, /tag/, /brand/) paginate as ".../page/N/";
// the WP search page as "/page/N/?s=keyword".
function listUrl(input, page) {
    let path = input.indexOf("http") === 0 ? input : BASE_URL + input;
    if (path.charAt(path.length - 1) !== "/") path = path + "/";
    return page === "1" ? path : path + "page/" + page + "/";
}
