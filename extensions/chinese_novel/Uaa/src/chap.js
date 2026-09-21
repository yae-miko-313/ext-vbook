load('config.js');

function execute(url) {
    var response = fetch(normalizeUrl(url), {
        headers: {
            "Referer": BASE_URL + "/"
        }
    });
    if (!response.ok) return Response.error(CF_MESSAGE);

    var doc = response.html();
    if (isCloudflare(doc)) return Response.error(CF_MESSAGE);

    var content = "";
    var locked = false;
    var lines = doc.select(".reader-body > p");
    for (var i = 0; i < lines.size(); i++) {
        var line = lines.get(i);
        // Guest view of a member chapter: a login prompt paragraph, then site ads.
        if (!line.select(".login_click").isEmpty()) {
            locked = true;
            break;
        }
        var text = cleanText(line.text());
        if (text) content += text + "<br>";
    }
    if (locked) content += "<br>（以下正文内容需要登录 UAA 才能阅读）";

    if (!content) return Response.error("Không đọc được nội dung chương");
    return Response.success(content);
}

function cleanText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
}
