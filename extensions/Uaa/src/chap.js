load('config.js');

function execute(url) {
    var cfMessage = "Mở browser lên mà verify Cloudflare đi bạn ơi";
    var chapterUrl = normalizeUrl(url);
    var response = fetch(chapterUrl, {
        headers: {
            "Referer": BASE_URL + "/",
            "User-Agent": UserAgent.android()
        }
    });

    if (!response || !response.ok) return Response.error(cfMessage);

    var doc = response.html();
    if (isCloudflare(doc)) return Response.error(cfMessage);

    var content = "";
    var lines = doc.select(".chapter_box .line, .line");
    for (var i = 0; i < lines.size(); i++) {
        var text = cleanText(lines.get(i).text() + "");
        if (text) content += text + "<br>";
    }

    if (!content) return Response.error("Không đọc được nội dung chương");
    return Response.success(content);
}

function normalizeUrl(url) {
    url = ((url || "") + "").trim();
    if (url.indexOf("//") === 0) return "https:" + url;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.charAt(0) === "/") return BASE_URL + url;
    return BASE_URL + "/" + url;
}

function isCloudflare(doc) {
    return doc.select("#cf-error-details, .cf-browser-verification, #challenge-form, #challenge-error-text").size() > 0;
}

function cleanText(text) {
    return ((text || "") + "").replace(/\s+/g, " ").trim();
}
