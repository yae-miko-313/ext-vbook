let BASE_URL = "https://www.shubenshu.com";
try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (error) {
}

function normalizeUrl(url) {
    return url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
}

function absUrl(path) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    return BASE_URL + (path.indexOf("/") === 0 ? "" : "/") + path;
}

// Listing rows carry no <img>; covers live at a fixed path keyed by the book id (/lC94/ -> /newpics/lC94.jpg).
function coverOf(link) {
    let m = String(link).match(/\/(l[A-Za-z0-9]+)\/?$/);
    return m ? BASE_URL + "/newpics/" + m[1] + ".jpg" : "";
}
