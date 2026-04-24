load("config.js");

function isAllowedTrack(url) {
    var low = (url || "").toLowerCase();
    if (!low) return false;
    if (low.indexOf("ads.zorvec.top") > -1) return false;
    if (low.indexOf("du88.to") > -1) return false;
    if (low.indexOf("mubet.win") > -1) return false;
    if (low.indexOf("9bet.download") > -1) return false;
    if (low.indexOf(".m3u8") > -1 || low.indexOf(".mp4") > -1) return true;
    if (low.indexOf("streamqq.com") > -1) return true;
    if (low.indexOf("trivonix.top") > -1) return true;
    if (low.indexOf("playheovl.xyz") > -1) return true;
    return false;
}

function pushTrack(tracks, seen, url) {
    url = (url || "") + "";
    if (!url) return;
    url = url.replace(/&amp;/g, "&");
    url = normalizeLink(url);
    if (!isAllowedTrack(url)) return;
    if (seen[url]) return;
    seen[url] = true;
    tracks.push({ title: "Server " + String(tracks.length + 1), data: url });
}

function extractFromText(text, tracks, seen) {
    if (!text) return;
    var raw = (text || "") + "";
    raw = raw.replace(/\\\//g, "/");
    var re = /https?:\/\/[^\s"'<>]+/ig;
    var m;
    while ((m = re.exec(raw)) !== null) {
        pushTrack(tracks, seen, (m[0] || "") + "");
    }
}

function extractFromDom(doc, tracks, seen) {
    doc.select("iframe[src], source[src], video[src], a[href]").forEach(function(el) {
        var u = (el.attr("src") || el.attr("href") || "") + "";
        pushTrack(tracks, seen, u);
    });
}

function extractFromBrowser(detailUrl, tracks, seen) {
    var browser = Engine.newBrowser();
    try {
        browser.setUserAgent(UserAgent.android);
        browser.launchAsync(detailUrl);
        sleep(9000);
        var reqs = browser.urls();
        reqs.forEach(function(raw) {
            var u = (raw || "") + "";
            if (!u) return;
            pushTrack(tracks, seen, u);
            try {
                var decoded = decodeURIComponent(u) + "";
                pushTrack(tracks, seen, decoded);
            } catch (e) {}
        });
        var html = browser.html() + "";
        extractFromText(html, tracks, seen);
    } finally {
        try { browser.close(); } catch (e2) {}
    }
}

function execute(url) {
    url = normalizeHost(url);

    var tracks = [];
    var seen = {};

    var res = fetch(url, { method: "GET" });
    if (!res.ok) return Response.error("Cannot load: " + res.status);
    var doc = res.html();

    extractFromDom(doc, tracks, seen);
    extractFromText(res.text() + "", tracks, seen);

    if (tracks.length === 0) {
        extractFromBrowser(url, tracks, seen);
    }

    if (tracks.length === 0) return Response.error("No video tracks found");
    return Response.success(tracks);
}