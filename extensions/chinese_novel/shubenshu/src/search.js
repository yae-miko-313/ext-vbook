load('config.js');
function execute(query, page) {
    query = query || "";
    page = page || "1";

    let response;
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        let path = query;
        if (page !== "1") path = path.replace(/\/?$/, "_" + page + "/");
        response = fetch(encodeURI(absUrl(path)));
    } else {
        response = fetch(BASE_URL + "/e/search/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "keyboard=" + encodeURIComponent(query) + "&show=title,ftitle,writer"
        });
        // Search POST answers 302 -> result/?searchid=N, which the app doesn't follow for POST.
        if (response.status === 301 || response.status === 302) {
            let location = String(response.header("location") || response.header("Location") || "");
            if (!location) return Response.error("HTTP " + response.status);
            if (location.indexOf("http") !== 0 && location.indexOf("/") !== 0) location = "/e/search/" + location;
            response = fetch(absUrl(location));
        }
    }
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let items = [];
    let rows = doc.select("#newscontent .l li");
    if (!rows.isEmpty()) {
        rows.forEach(function (el) {
            let a = el.select(".s2 a").first();
            if (!a) return;
            let link = a.attr("href");
            items.push({
                name: a.text(),
                link: link,
                cover: coverOf(link),
                description: el.select(".s4").text() + " · " + el.select(".s3").text(),
                host: BASE_URL
            });
        });
    } else {
        doc.select("#hotcontent .item").forEach(function (el) {
            let a = el.select("dt a").first();
            if (!a) return;
            items.push({
                name: a.text(),
                link: a.attr("href"),
                cover: absUrl(el.select(".image img").attr("data-original")),
                description: el.select(".btm a").text(),
                host: BASE_URL
            });
        });
    }

    if (items.length === 0) {
        // Empire CMS answers throttled/failed searches with a "信息提示" notice page.
        let msg = doc.select(".box, table").text();
        let pageTitle = doc.select("title").text();
        if (pageTitle.indexOf("信息提示") !== -1 || pageTitle.indexOf("資訊提示") !== -1) return Response.error(msg || pageTitle);
    }

    let hasNext = !doc.select("#pagelink strong + a").isEmpty();
    let nextPage = hasNext ? (parseInt(page, 10) + 1).toString() : "";
    return Response.success(items, nextPage);
}
