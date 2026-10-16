load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    var html = response.text() + "";
    var doc = Html.parse(html);
    var info = getThreadInfo(html);

    var title = doc.select("h1.main-title").text();
    if (!title) return Response.error("Không tìm thấy bài viết");
    var s = parseSubject(title);
    var poster = doc.select("span.sender a").text() || info.username || "";
    var author = s.author || poster;

    var detail = ["书名：" + s.name, "作者：" + (author || "未知")];
    if (poster) detail.push("送交者：" + poster);
    var time = doc.select("span.sender").text().match(/于\s*([\d-]+\s+[\d:]+)/);
    if (time) detail.push("时间：" + time[1]);
    var views = doc.select("span.views").text();
    if (views) detail.push(views);

    var pre = doc.select("#content-section pre");
    pre.select("a[href*=act=threadview]").remove();
    var text = pre.text().replace(/\s+/g, " ").trim();
    var description = text.length > 300 ? text.substring(0, 300) + "…" : text;

    var tid = getTid(url);
    var suggests = [];
    if (info.uid) {
        suggests.push({
            title: "送交者的其他帖子",
            input: BASE_URL + "/index.php?app=forum&act=getuserthread&uid=" + info.uid + "&tid=" + tid,
            script: "similar.js"
        });
    }

    return Response.success({
        name: s.name,
        cover: "",
        author: author,
        description: description,
        detail: detail.join("<br>"),
        ongoing: !/完/.test(title),
        host: BASE_URL,
        suggests: suggests,
        comments: [{ title: "跟帖", input: tid, script: "comment.js" }]
    });
}
