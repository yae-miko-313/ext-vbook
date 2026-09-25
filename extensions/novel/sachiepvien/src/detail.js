load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let article = doc.select("article.post-inner").first();
    if (!article) return Response.error("Không tìm thấy nội dung truyện");

    let name = doc.select(".title_single_area h1").text();
    let category = doc.select(".rh-cat-list-title a").first();
    let author = doc.select(".tag_truyen a[rel=tag]").first();
    let commentCount = doc.select(".comm_count_meta a").text();
    let views = doc.select(".postview_meta").text().trim();
    let updated = doc.select(".date_meta").first().text().trim();

    let cover = article.select(".mediad_before_content img").attr("src");
    if (!cover) cover = doc.select(".newsimage img").attr("src");

    let tags = [];
    if (category) tags.push({ title: category.text(), input: category.attr("href"), script: "search.js" });
    if (author) tags.push({ title: author.text(), input: author.attr("href"), script: "search.js" });

    // The intro sits loose in the article body; strip the surrounding widgets so
    // only the description paragraphs remain (the excerpt lives in the accordion).
    // Must run after every field above is read - these nodes hold them.
    article.select("style, .title_single_area, .mediad, .wpsm-accordion, .priced_block, .single_custom_bottom_left, .tags, .wp-block-group").forEach(function (el) {
        el.remove();
    });

    return Response.success({
        name: name,
        author: author ? author.text() : "",
        cover: cover,
        description: article.html(),
        // `detail` is rendered as HTML, so line breaks need <br>, not \n alone.
        detail: "Tên truyện: " + name + "<br>\n" +
            "Lượt xem: " + views + "<br>\n" +
            "Bình luận: " + (commentCount || "0") + "<br>\n" +
            "Cập nhật: " + updated,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: false,
        tags: tags,
        genres: category ? [{ title: "Cùng chuyên mục", input: category.attr("href"), script: "search.js" }] : [],
        comments: [
            { title: "Bình luận (" + (commentCount || "0") + ")", input: url, script: "comments.js" }
        ]
    });
}
