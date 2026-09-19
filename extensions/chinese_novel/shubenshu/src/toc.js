load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    let m = url.match(/\/(l[A-Za-z0-9]+)\/?$/);
    if (!m) return Response.error("URL không hợp lệ");
    let response = fetch(BASE_URL + "/" + m[1] + "_list/");
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let chapters = [];
    doc.select("#list a[rel=chapter]").forEach(function (el) {
        let href = el.attr("href");
        // Hidden bot_test.php links are honeypot entries, not real chapters.
        if (href.indexOf(".html") === -1 || href.indexOf("bot_test") !== -1) return;
        chapters.push({ name: el.text(), url: href, host: BASE_URL });
    });
    return Response.success(chapters);
}
