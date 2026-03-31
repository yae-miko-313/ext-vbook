let BASE_URL = "https://qadcuteo.cc";
if (typeof host !== "undefined") {
    BASE_URL = host;
}

function cleanImageUrl(url) {
    url = url.replace(/\?.*$/, '');
    url = url.replace(/-\d+x\d+\./, '.');
    return url;
}
