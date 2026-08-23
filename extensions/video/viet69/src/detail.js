load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let name = doc.select("meta[property=og:title]").attr("content").replace(/\s*-\s*Viet69\s*$/i, "");
    if (!name) name = doc.select("h2.siteheading a").first().text();

    let tags = [];
    doc.select("div.entry-tags a[rel=tag]").forEach(function (el) {
        tags.push({ title: el.text(), input: el.attr("href"), script: "search.js" });
    });

    let detailInfo = "Ngày đăng: " + doc.select("span.time").text().replace(/^on\s*/i, "")
        + "<br>Lượt thích: " + doc.select("span.video-action__like-count").text();

    return Response.success({
        name: name,
        author: doc.select("span.author a").first().text(),
        cover: doc.select("meta[property=og:image]").attr("content"),
        description: doc.select("meta[property=og:description]").attr("content"),
        detail: detailInfo,
        url: url,
        type: "video",
        format: "series",
        ongoing: false,
        nsfw: true,
        locale: "vi",
        tags: tags,
        genres: [],
        suggests: [
            { title: "Có thể bạn thích", input: url, script: "similar.js" }
        ],
        reviews: [],
        comments: [
            { title: "Bình luận", input: url, script: "comments.js" }
        ]
    });
}
