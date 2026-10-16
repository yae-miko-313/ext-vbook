load('config.js');

// A serial is the main post, plus the later parts the poster links from it
// (index posts edited after each update) and the poster's own follow-ups.
// Other users' follow-ups are comments and live in comment.js.
function execute(url) {
    url = normalizeUrl(url);
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    var html = response.text() + "";
    var doc = Html.parse(html);
    var info = getThreadInfo(html);
    var tid = getTid(url);

    var seen = {};
    seen[tid] = true;
    var parts = [];
    doc.select("#content-section pre a[href*=act=threadview]").forEach(function (a) {
        var id = getTid(a.attr("href"));
        if (!id || seen[id] || a.attr("href").indexOf("/bbs4/") < 0 && /^https?:/.test(a.attr("href"))) return;
        seen[id] = true;
        parts.push({ tid: id, name: a.text() });
    });

    var json = getJson(BASE_URL + "/index.php?app=forum&act=achildlist&tid=" + tid) || [];
    for (var i = 0; i < json.length; i++) {
        var item = json[i];
        if (seen[item.tid] || String(item.uid) !== String(info.uid) || parseInt(item.size, 10) <= 0) continue;
        seen[item.tid] = true;
        parts.push({ tid: item.tid, name: stripTags(item.subject) });
    }
    parts.sort(function (a, b) { return parseInt(a.tid, 10) - parseInt(b.tid, 10); });

    var data = [{ name: doc.select("h1.main-title").text() || "正文", url: url, host: BASE_URL }];
    for (var j = 0; j < parts.length; j++) {
        data.push({ name: parts[j].name, url: threadUrl(parts[j].tid), host: BASE_URL });
    }
    return Response.success(data);
}
