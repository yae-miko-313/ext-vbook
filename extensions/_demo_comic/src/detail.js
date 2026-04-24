// detail.js — Thông tin chi tiết một bộ truyện tranh
// Contract: execute(url) → { name*, cover, host, author, detail, description, ongoing:bool*,
//                             genres?:[{title,input,script}], suggests?:[{title,input,script}] }
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);

    var res = fetch(url);
    if (!res.ok) return Response.error("Cannot load: " + res.status);

    var doc = res.html();

    // TODO: Selector tên truyện (thường là h1)
    var nameEl = doc.select("SELECTOR_TITLE").first();
    var name = (nameEl ? nameEl.text() : "") + "";

    // TODO: Selector ảnh bìa — ưu tiên data-src, data-lazy-src (lazy-load)
    var coverEl = doc.select("SELECTOR_COVER_IMG").first();
    var cover = "";
    if (coverEl) {
        cover = (coverEl.attr("data-src") || coverEl.attr("data-lazy-src") || coverEl.attr("src") || "") + "";
        if (cover.startsWith("//")) cover = "https:" + cover;
        if (cover && !cover.startsWith("http")) cover = BASE_URL + cover;
    }

    // TODO: Selector tác giả
    var authorEl = doc.select("SELECTOR_AUTHOR").first();
    var author = (authorEl ? authorEl.text() : "") + "";

    // TODO: Selector trạng thái ("Đang ra" / "Hoàn thành" / "Ongoing" / "Completed")
    var statusEl = doc.select("SELECTOR_STATUS").first();
    var status = (statusEl ? statusEl.text() : "") + "";
    var ongoing = status.indexOf("Hoàn") === -1
               && status.indexOf("Completed") === -1
               && status.indexOf("Full") === -1;

		// TODO: Selector chi tiết: ví dụ như lượt xem, tác giả, ngày đăng, ...
		var detailEl = doc.select("SELECTOR_DETAIL").first();
		var detail = (detailEl ? detailEl.html() : "") + "";

    // TODO: Selector container mô tả / tóm tắt
    var descEl = doc.select("SELECTOR_DESCRIPTION").first();
    var description = (descEl ? descEl.html() : "") + "";

    // TODO: Selector các link thể loại
    var genres = [];
    doc.select("SELECTOR_GENRE_LINKS").forEach(function(el) {
        var gTitle = el.text() + "";
        var gHref  = (el.attr("href") || "") + "";
        if (!gTitle || !gHref) return;
        if (!gHref.startsWith("http")) gHref = BASE_URL + gHref;
        genres.push({ title: gTitle, input: gHref, script: "gen.js" });
    });

    var suggests = [];
    if (author) {
        suggests.push({ title: "Cùng tác giả: " + author, input: author, script: "search.js" });
    }

    return Response.success({
        name:        name,
        cover:       cover,
        host:        BASE_URL,
        author:      author,
				detail:      detail,
        description: description,
        ongoing:     ongoing,
        genres:      genres.length > 0 ? genres : undefined,
        suggests:    suggests.length > 0 ? suggests : undefined
    });
}
