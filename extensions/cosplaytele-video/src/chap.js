load("config.js");

function normalizeLink(link) {
    if (!link) return "";
    link = link + "";
    if (link.startsWith("//")) return "https:" + link;
    if (link.startsWith("/")) return BASE_URL + link;
    if (!link.startsWith("http")) return BASE_URL + "/" + link;
    return link;
}

function pushTrack(tracks, seen, title, data) {
    if (!data) return;
    data = normalizeLink(data);
    if (!data || seen[data]) return;
    seen[data] = true;
    tracks.push({ title: title, data: data });
}

function execute(url) {
    if (!url) return Response.error("No url");
    url = normalizeLink(url);

    var res = fetch(url, { method: "GET" });
    if (!res.ok) return Response.error("Cannot load: " + res.status);

    var doc = res.html();
    var tracks = [];
    var seen = {};
    var idx = 1;

    doc.select(".entry-content iframe").forEach(function(el) {
        var src = (el.attr("src") || "") + "";
        pushTrack(tracks, seen, "Embed " + idx, src);
        idx = idx + 1;
    });

    doc.select(".entry-content video source").forEach(function(el) {
        var src = (el.attr("src") || "") + "";
        pushTrack(tracks, seen, "Source " + idx, src);
        idx = idx + 1;
    });

    doc.select(".entry-content video").forEach(function(el) {
        var src = (el.attr("src") || "") + "";
        pushTrack(tracks, seen, "Video " + idx, src);
        idx = idx + 1;
    });

    doc.select(".entry-content a").forEach(function(el) {
        var href = (el.attr("href") || "") + "";
        if (!href) return;
        if (href.indexOf(".mp4") > -1 || href.indexOf(".m3u8") > -1 || href.indexOf("/embed/") > -1) {
            pushTrack(tracks, seen, "Link " + idx, href);
            idx = idx + 1;
        }
    });

    if (tracks.length === 0) return Response.error("No video stream found");
    return Response.success(tracks);
}