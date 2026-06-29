load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    var res = fetch(storyUrl, FETCH_OPTIONS);
    if (!res || !res.ok) return Response.error("Mở browser lên mà verify Cloudflare đi bạn ơi");
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được nội dung trang");

    // Cover - dùng srcset để lấy ảnh gốc (entry cuối cùng)
    var cover = "";
    var imgEl = selFirst(doc, ".summary-image img, .summary_image img");
    if (imgEl) {
        var srcset = imgEl.attr("srcset") || "";
        if (srcset) {
            // srcset: "url1 175w, url2 193w, url3.webp 351w" → lấy entry cuối
            var entries = srcset.split(",");
            var lastEntry = entries[entries.length - 1].replace(/^\s+/, "").split(/\s+/)[0];
            cover = lastEntry || stripSizeSuffix(imgEl.attr("src") || "");
        } else {
            cover = stripSizeSuffix(imgEl.attr("src") || "");
        }
    }

    // Tiêu đề - dùng .ownText() không được trên vBook, dùng cách xóa badge span
    var name = "";
    var h1 = selFirst(doc, "h1.post-title, h1");
    if (h1) {
        var badges = h1.select("span.manga-title-badges");
        for (var bi = 0; bi < badges.size(); bi++) {
            badges.get(bi).remove();
        }
        name = h1.text().replace(/\s+/g, " ").trim();
    }
    if (!name) name = "HentaiCube";

    // Mô tả
    var description = "";
    var descEl = selFirst(doc, ".summary__content p, .description-summary p, .manga-excerpt");
    if (descEl) {
        description = descEl.text().trim();
    }

    // Tình trạng
    var status = "";
    var statusEl = selFirst(doc, ".post-status .summary-content");
    if (statusEl) {
        status = statusEl.text().trim();
    }

    // Tác giả
    var author = "HentaiCube";
    var authorHref = "";
    var authorEl = selFirst(doc, ".author-content a[href*='/tacgia/']");
    if (authorEl) {
        var authorText = authorEl.text().replace(/\s+/g, " ").trim();
        if (authorText) author = authorText;
        authorHref = authorEl.attr("href") || "";
    }

    // Thể loại
    var genres = [];
    var seen = {};
    var genreLinks = doc.select("a[href*='/theloai/']");
    for (var gi = 0; gi < genreLinks.size(); gi++) {
        var ga = genreLinks.get(gi);
        var gh = ga.attr("href") || "";
        var gm = GENRE_SLUG_RE.exec(gh);
        if (!gm) continue;
        var slug = gm[1];
        if (seen[slug]) continue;
        seen[slug] = true;
        var gname = ga.text().trim();
        if (!gname) continue;
        genres.push({ title: gname, input: slug, script: "genrecontent.js" });
    }

    var suggests = [];
    if (authorHref && author !== "HentaiCube") {
        suggests.push({ title: "Cùng tác giả: " + author, input: authorHref, script: "authorcontent.js" });
    }

    var detail = description;
    if (status) detail = (detail ? detail + "\n" : "") + "Tình trạng: " + status;

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: author,
        detail: detail,
        description: description,
        ongoing: false,
        genres: genres,
        suggests: suggests.length > 0 ? suggests : undefined
    });
}
