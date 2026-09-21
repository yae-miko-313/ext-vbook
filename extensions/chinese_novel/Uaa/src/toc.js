load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    let response = fetch(url);
    if (!response.ok) return Response.error(CF_MESSAGE);

    let doc = response.html();
    if (isCloudflare(doc)) return Response.error(CF_MESSAGE);

    let data = [];
    doc.select("#ndcBody a.ndc-row").forEach(function (e) {
        data.push({
            name: e.select(".ndc-name").text(),
            url: normalizeUrl(e.attr("href")),
            host: BASE_URL
        });
    });
    return Response.success(data);
}
