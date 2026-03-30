load("config.js");
function toAbsolute(url) {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("//")) return "https:" + url;
    return BASE_URL + (url.startsWith("/") ? "" : "/") + url;
}
function setPageParam(u, page) {
    let abs = u;
    if (!abs.startsWith("http")) abs = BASE_URL + (u.startsWith("/") ? "" : "/") + u;
    if (!page) return abs;
    if (abs.indexOf("?") === -1) return abs + "?page=" + page;
    if (/([?&])page=\d+/.test(abs)) return abs.replace(/([?&])page=\d+/, "$1page=" + page);
    return abs + (abs.endsWith("?") || abs.endsWith("&") ? "" : "&") + "page=" + page;
}
function execute(url, page) {
    if (!page) page = "1";
    const pageUrl = setPageParam(url, page);
    const res = fetch(pageUrl);
    if (!res || !res.ok) return Response.success([]);
    const doc = res.html();
    
    let list = [];
    doc.select(".novel-grid .novel-card").forEach(card => {
        let a = card.select("a[href]").first();
        if (!a) return;
        let link = a.attr("href") || "";
        let img = card.select("img").first();
        let titleEl = card.select("h2").first();

        let title = titleEl ? titleEl.text() : "";
        if (!title && img) title = img.attr("alt") || "";
        if (!title) title = a.attr("title") || a.text();
        
        if (title) title = title.replace(/^Bìa truyện\s+/i, '').trim();

        let cover = img ? (img.attr("data-src") || img.attr("data-original") || img.attr("src") || "") : "";
        let meta = [];
        card.select(".text-white.text-xs span").forEach(s => {
            let t = s.text().trim();
            if (t) meta.push(t);
        });
        if (title && link) list.push({ name: title, link: toAbsolute(link), cover: toAbsolute(cover), description: meta.join(" · "), host: BASE_URL });
    });

    let nextPage = "";
    const cur = parseInt(page);
    let rightHref = "";
    doc.select("a").forEach(a => {
        if (rightHref) return;
        const span = a.select("span.material-symbols-outlined").first();
        if (span && (span.text() || "").trim() === "chevron_right") rightHref = a.attr("href") || "";
    });
    if (rightHref) {
        const m = rightHref.match(/(?:[?&]|\/)page=(\d+)/);
        if (m) {
            const p = parseInt(m[1]);
            if (p > cur) nextPage = String(p);
        }
    }
    return Response.success(list, nextPage);
}