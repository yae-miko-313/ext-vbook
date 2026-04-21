load('config.js');

function execute(url, page) {
    if (!page) page = "1";
    if (!url) url = "/";

    // normalize
    url = url.replace(/\/$/, "");

    let listUrl;
    if (url === "" || url === "/") {
        // Home listing
        listUrl = page === "1" ? BASE_URL + "/" : BASE_URL + "/page/" + page + "/";
    } else {
        // Tag/Category listing
        if (/^https?:\/\//.test(url)) {
            url = url.replace(BASE_URL, "");
        }
        if (!url.startsWith("/")) url = "/" + url;
        listUrl = page === "1" ? (BASE_URL + url + "/") : (BASE_URL + url + "/page/" + page + "/");
        // collapse possible double slashes
        listUrl = listUrl.replace(/([^:]\/)(\/)+/g, '$1/');
    }

    let response = fetch(listUrl, { method: "GET" });
    if (response.ok) {
        let doc = response.html();
        let data = [];
        doc.select("#post-list .col.post-item").forEach(e => {
            let a = e.select(".post-title a").first();
            if (!a) return;
            let name = a.text();
            let link = a.attr("href");
            if (link) link = link.replace(BASE_URL, '');
            let img = e.select(".box-image img").first();
            let cover = img ? (img.attr('src') || img.attr('data-src') || img.attr('data-original')) : '';
            data.push({ name: name, link: link, cover: cover });
        });

        let next = '';
        let nextHref = doc.select("a.next.page-numbers").first().attr("href");
        if (nextHref) {
            let m = nextHref.match(/page\/(\d+)/);
            if (m) next = m[1];
        }
        return Response.success(data, next);
    }
    return Response.error("Failed to load list");
}
