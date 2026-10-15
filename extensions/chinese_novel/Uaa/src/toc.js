load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    let response = fetch(url);
    if (!response.ok) return Response.error(CF_MESSAGE);

    let doc = response.html();
    if (isCloudflare(doc)) return Response.error(CF_MESSAGE);

    let data = [];
    let kind = urlKind(url);
    // A video page is a single clip: one episode pointing back at the intro page.
    if (kind === "video") return Response.success([{ name: doc.select(".vd-title").text(), url: url, host: BASE_URL }]);
    if (kind === "comic") {
        doc.select("a.cd-ep").forEach(function (e) {
            data.push({ name: e.text().replace(/\s*游客$/, ""), url: normalizeUrl(e.attr("href")), host: BASE_URL });
        });
        return Response.success(data);
    }
    doc.select("#ndcBody a.ndc-row").forEach(function (e) {
        data.push({
            name: e.select(".ndc-name").text(),
            url: normalizeUrl(e.attr("href")),
            host: BASE_URL
        });
    });
    return Response.success(data);
}
