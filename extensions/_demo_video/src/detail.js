// detail.js — Thông tin chi tiết một phim/video
// Contract: execute(url) → { name*, cover, host, author, description, ongoing:bool*,
//                             genres?:[{title,input,script}], suggests?:[{title,input,script}],
//                             comments?:[{title,input,script}] }
function execute(url) {
    // Bước 1: Normalize URL
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var res = fetch(url);
    if (!res.ok) return Response.error("Cannot load: " + res.status);

    var doc = res.html();

    // Bước 2: Tên truyện — selector thẻ chứa tên (thường là h1)
    var nameEl = doc.select("SELECTOR_TITLE").first();
    var name = (nameEl ? nameEl.text() : "") + "";

    // Bước 3: Ảnh bìa — selector thẻ img, thử data-src trước (lazy-load)
    var coverEl = doc.select("SELECTOR_COVER_IMG").first();
    var cover = "";
    if (coverEl) {
        cover = (coverEl.attr("data-src") || coverEl.attr("src") || "") + "";
        if (cover.startsWith("//")) cover = "https:" + cover;
        if (cover && !cover.startsWith("http")) cover = BASE_URL + cover;
    }

    // Bước 4: Tác giả — selector link hoặc text tác giả
    var authorEl = doc.select("SELECTOR_AUTHOR").first();
    var author = (authorEl ? authorEl.text() : "") + "";

    // Bước 5: Trạng thái — "Đang ra" / "Hoàn thành" / "Ongoing" / "Completed"
    var statusEl = doc.select("SELECTOR_STATUS").first();
    var status = (statusEl ? statusEl.text() : "") + "";
    var ongoing = status.indexOf("Hoàn") === -1
               && status.indexOf("Completed") === -1
               && status.indexOf("Full") === -1
               && status.indexOf("完结") === -1;

    // Bước 6: Mô tả — selector container chứa tóm tắt, lấy html() để giữ định dạng
    var descEl = doc.select("SELECTOR_DESCRIPTION").first();
    var description = (descEl ? descEl.html() : "") + "";

    // Bước 7: Thể loại — selector các thẻ <a> link thể loại
    var genres = [];
    doc.select("SELECTOR_GENRE_LINKS").forEach(function(el) {
        var gTitle = el.text() + "";
        var gHref  = (el.attr("href") || "") + "";
        if (!gTitle || !gHref) return;
        if (!gHref.startsWith("http")) gHref = BASE_URL + gHref;
        genres.push({ title: gTitle, input: gHref, script: "gen.js" });
    });

    // Bước 8: Gợi ý — phim/video liên quan hoặc cùng tác giả/đạo diễn (tùy chọn)
    var suggests = [];
    // Cách đơn giản: tìm theo tác giả nếu có search.js
    if (author) {
        suggests.push({ title: "Cùng tác giả: " + author, input: author, script: "search.js" });
    }

    // Bước 9: Bình luận — chỉ thêm nếu site có API comment (Q9=Có)
    // var comments = [{ title: "Bình luận", input: API_URL + "?page={{page}}", script: "comment.js" }];

    return Response.success({
        name:        name,
        cover:       cover,
        host:        BASE_URL,
        author:      author,
        description: description,
        ongoing:     ongoing,
        format:      "series", // Định dạng "series" dành cho web có nhiều tập, nếu phim lẻ có thể bỏ hoặc để khác
        genres:      genres.length > 0 ? genres : undefined,
        suggests:    suggests.length > 0 ? suggests : undefined
        // comments: comments  // bỏ comment dòng này nếu có comment.js
    });
}
