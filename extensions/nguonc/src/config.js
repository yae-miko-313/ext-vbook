let BASE_URL = "https://phim.nguonc.com";
try { if (CONFIG_URL) BASE_URL = CONFIG_URL; } catch (e) {}

function normalizeLink(link) {
    if (!link) return "";
    link = link + "";
    if (link.startsWith("//")) return "https:" + link;
    if (link.startsWith("/")) return BASE_URL + link;
    if (!link.startsWith("http")) return BASE_URL + "/" + link;
    return link;
}

function normalizeApiBase(url) {
    if (!url) return BASE_URL;
    var s = (url + "").replace(/\/$/, "");
    if (s.indexOf("/api") > -1) {
        s = s.split("/api")[0];
    }
    return s;
}

function buildFilmWebUrl(slug) {
    return BASE_URL + "/phim/" + encodeURIComponent(slug + "");
}

function buildFilmApiUrl(slug) {
    return BASE_URL + "/api/film/" + encodeURIComponent(slug + "");
}

function getJson(url) {
    var res = fetch(url, { method: "GET" });
    if (!res.ok) return { ok: false, status: res.status, data: null };
    return { ok: true, status: res.status, data: res.json() };
}

function cleanText(s) {
    return ((s || "") + "").replace(/\s+/g, " ").trim();
}
