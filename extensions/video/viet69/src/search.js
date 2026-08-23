load('config.js');
function execute(query, page) {
    query = query || "";
    page = page || "1";

    let url;
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        let base = query.indexOf("http") === 0 ? normalizeUrl(query) : BASE_URL + query;
        if (base.charAt(base.length - 1) !== "/") base = base + "/";
        url = page === "1" ? base : base + "page/" + page + "/";
    } else {
        url = page === "1" ? BASE_URL + "/?s=" + encodeURIComponent(query)
            : BASE_URL + "/page/" + page + "/?s=" + encodeURIComponent(query);
    }

    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let items = parseItems(doc);
    let hasNext = !doc.select("div.loop-nav a.next, div.loop-nav a.nextpostslink").isEmpty();
    let nextPage = hasNext ? (parseInt(page, 10) + 1).toString() : "";

    return Response.success(items, nextPage);
}
