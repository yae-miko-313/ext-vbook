let BASE_URL = "https://hentaivietsub.com";
try { if (CONFIG_URL) BASE_URL = CONFIG_URL; } catch (e) {}

function normalizeLink(link) {
    if (!link) return "";
    link = link + "";
    if (link.startsWith("//")) return "https:" + link;
    if (link.startsWith("/")) return BASE_URL + link;
    if (!link.startsWith("http")) return BASE_URL + "/" + link;
    return link;
}

function normalizeHost(url) {
    if (!url) return "";
    url = url + "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return normalizeLink(url);
}