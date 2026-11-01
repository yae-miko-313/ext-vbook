load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    if (url.charAt(url.length - 1) !== "/") url = url + "/";

    let response = httpGet(url);
    if (!response.ok) return Response.error("HTTP " + response.status);

    let doc = response.html();

    let name = doc.select(".summary-content .title .text").text().trim();
    if (!name) name = doc.select(".summary-content h1.title").text().trim();
    if (!name) name = doc.select(".book-title").text().trim();
    if (!name) name = doc.select(".book_newtitle").text().trim();

    let author = doc.select(".author-name span").text().trim();
    if (!author) author = doc.select(".author-name").text().trim();
    if (!author) {
        let authorMatch = doc.select(".book_info3").text().match(/^([^\/]+)/);
        if (authorMatch) author = authorMatch[1].trim();
    }

    let cover = doc.select(".summary-pic img").attr("src");
    if (!cover) cover = doc.select(".figure .pic img").attr("src");
    if (!cover) cover = doc.select(".book_info img").attr("src");

    let desc = doc.select(".introduce").text().trim();
    if (!desc) desc = doc.select(".book_profile .book_bk_qs1").text().trim();

    let detailLines = ["书名：" + name, "作者：" + (author ? author : "未知")];
    let countSpans = doc.select(".count-detail .text-row span");
    if (!countSpans.isEmpty()) {
        for (let i = 0; i < countSpans.size(); i++) {
            let t = countSpans.get(i).text().trim();
            if (t) detailLines.push(t);
        }
    } else {
        let info2 = doc.select(".book_info2").text().trim();
        if (info2) detailLines.push("分类：" + info2);
        let info3 = doc.select(".book_info3").text().trim();
        if (info3) detailLines.push("详情：" + info3);
    }

    let isFinished = doc.select(".count-detail").text().indexOf("完结") !== -1
        || doc.select(".book_info2").text().indexOf("已完结") !== -1;

    let tags = [];
    let tagEls = doc.select(".tag-list .tag a");
    for (let i = 0; i < tagEls.size(); i++) {
        let el = tagEls.get(i);
        let tName = el.select(".text").text().trim();
        if (!tName) tName = el.text().trim();
        let tHref = el.attr("href");
        if (tName && tHref) {
            tags.push({
                title: tName,
                input: absUrl(tHref),
                script: "gen.js"
            });
        }
    }

    let genres = [];
    if (tags.length > 0) {
        genres.push({
            title: "Cùng thể loại",
            input: tags[0].input,
            script: "gen.js"
        });
    }

    let suggests = [];
    let authorClub = doc.select(".author-info a[href*='/Club/'], .count-info a[href*='/Club/']").first();
    if (authorClub) {
        suggests.push({
            title: "Cùng tác giả",
            input: absUrl(authorClub.attr("href")),
            script: "gen.js"
        });
    }

    return Response.success({
        name: name,
        author: author,
        cover: absUrl(cover),
        description: desc,
        detail: detailLines.join("<br>"),
        url: url,
        host: BASE_URL,
        type: "chinese_novel",
        format: "novel",
        ongoing: !isFinished,
        tags: tags,
        genres: genres,
        suggests: suggests,
        reviews: [],
        comments: []
    });
}
