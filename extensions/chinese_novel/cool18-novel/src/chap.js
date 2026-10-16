load('config.js');

function execute(url) {
    var response = fetch(normalizeUrl(url));
    if (!response.ok) return Response.error("HTTP " + response.status);
    var doc = response.html();

    var pre = doc.select("#content-section pre");
    if (pre.isEmpty()) return Response.error("Không đọc được nội dung chương");
    // Links to the other parts belong to the TOC, not the chapter text.
    pre.select("script, iframe, .adv-6park, .view_ad_incontent, a[href*=act=threadview]").remove();

    var lines = pre.html()
        .replace(/\r\n?/g, "\n")
        .replace(/<p>\s*<\/p>|<br\s*\/?>/gi, "\n")
        .split("\n");
    var indented = 0;
    for (var i = 0; i < lines.length; i++) {
        if (/^[ 　\t]{2,}/.test(lines[i])) indented++;
    }
    // Some posts are hard-wrapped at a fixed width: there a non-indented line
    // following a full-width line is a wrap and gets joined back.
    var wrapped = indented > 10 && indented * 3 >= lines.length;

    var paragraphs = [];
    var prev = "";
    for (var j = 0; j < lines.length; j++) {
        var line = lines[j];
        if (!/<img/i.test(line) && !line.replace(/<[^>]*>/g, "").trim()) {
            prev = "";
            continue;
        }
        if (wrapped && prev && !/^[ 　\t]{2,}/.test(line) && prev.trim().length >= 30) {
            paragraphs[paragraphs.length - 1] += line;
        } else {
            paragraphs.push(line);
        }
        prev = line;
    }
    if (paragraphs.length === 0) return Response.error("Không đọc được nội dung chương");
    return Response.success(paragraphs.join("<br>"));
}
