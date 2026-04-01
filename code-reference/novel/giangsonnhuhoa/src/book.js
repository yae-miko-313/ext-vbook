load("config.js");
function getPageUrl(url, page) {
    if (page === '1' || !page) return url;
    let cleanUrl = url.replace(/\/$/, '');
    if (cleanUrl.match(/\/page\/\d+/)) return cleanUrl.replace(/\/page\/\d+/, '/page/' + page + '/');
    return cleanUrl + '/page/' + page + '/';
}
function execute(url, page) {
    if (!page) page = '1';
    let fetchUrl = getPageUrl(url, page);
    let res = fetch(fetchUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (res.ok) {
        let data = [];
        res.html().select("article, .post, .item, .post-item, .type-post").forEach(e => {
            let t = e.select("h2.title a, .post-title a, h3 a, h1 a, h4 a").first();
            if (t) {
                let href = t.attr("href") || "";
                let rawName = t.text().trim();
                let cleanName = rawName.replace(/^\s*(?:#|\[|“|"|'|‘)?\s*(?:ttty|gsnh|ttyy|gs|tt)\s*(?:\])?\s*\d+[\s\-:–"”'‘\.\|]*/i, "").trim();
                if (!cleanName) cleanName = rawName;
                
                let lowHref = href.toLowerCase();
                if (lowHref.includes("chuong-") || lowHref.includes("-chuong")) return;
                if (/^Chương\s*\d+/i.test(cleanName) || cleanName.toLowerCase() === "trang chủ") return;
                if (href === BASE_URL || href === BASE_URL + "/") return;
                
                let img = e.select("img").first();
                let cover = img ? (img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "") : "";
                if (cover.startsWith("//")) cover = "https:" + cover;
                
                data.push({ name: cleanName, link: href, cover: cover, host: BASE_URL });
            }
        });
        let nextPage = data.length > 0 ? (parseInt(page) + 1).toString() : "";
        return Response.success(data, nextPage);
    }
    return null;
}