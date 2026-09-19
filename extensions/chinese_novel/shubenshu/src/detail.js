load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    if (url.charAt(url.length - 1) !== "/") url = url + "/";
    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let info = doc.select("#info");
    if (info.isEmpty()) return Response.error("Không tìm thấy truyện");

    let authorEl = info.select("a[href^=/author/]").first();
    let stats = info.select("p.hidden-xs").first();
    let statsText = stats ? stats.text() : "";
    let category = doc.select(".con_top a[href^=/list_]").first();

    let detail = [];
    if (authorEl) detail.push("作者：" + authorEl.text());
    if (category) detail.push("类别：" + category.text());
    info.select("p.hidden-xs").forEach(function (el) {
        detail.push(el.text());
    });

    let tags = [];
    let genres = [];
    if (category) {
        tags.push({ title: category.text(), input: category.attr("href"), script: "search.js" });
        genres.push({ title: "Cùng thể loại", input: category.attr("href"), script: "search.js" });
    }
    let suggests = [];
    if (authorEl) suggests.push({ title: "Cùng tác giả", input: authorEl.attr("href"), script: "search.js" });

    return Response.success({
        name: info.select("h1").text(),
        author: authorEl ? authorEl.text() : "",
        cover: absUrl(doc.select("#fmimg img").attr("data-original")),
        description: doc.select("#intro").html(),
        detail: detail.join("<br>"),
        url: url,
        host: BASE_URL,
        type: "novel",
        format: "novel",
        ongoing: statsText.indexOf("完") === -1,
        tags: tags,
        genres: genres,
        suggests: suggests
    });
}
