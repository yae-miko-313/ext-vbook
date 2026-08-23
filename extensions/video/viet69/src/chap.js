load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let sources = [];
    doc.select("div.movieLoader-server button.video2-btn").forEach(function (el) {
        let movie = el.attr("data-video");
        if (!movie) return;
        sources.push({ label: el.text().trim() || "Server", handle: movie + "|" + (el.attr("data-type") || "25") });
    });

    if (sources.length === 0) {
        let loader = doc.select("div.movieLoader").first();
        if (loader !== null && loader.attr("data-movie")) {
            sources.push({ label: "Server #1", handle: loader.attr("data-movie") + "|" + (loader.attr("data-type") || "25") });
        }
    }

    if (sources.length === 0) return Response.error("Không tìm thấy nguồn phát");

    let servers = [];
    sources.forEach(function (s) {
        servers.push({ title: s.label + " · M3U8", data: "native|" + s.handle });
    });
    sources.forEach(function (s) {
        servers.push({ title: s.label + " · Auto", data: "auto|" + s.handle });
    });
    sources.forEach(function (s) {
        servers.push({ title: s.label + " · Webview", data: "web|" + s.handle });
    });

    return Response.success(servers);
}
