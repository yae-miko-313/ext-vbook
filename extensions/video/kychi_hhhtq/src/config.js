var BASE_URL = "https://hhhtq.team";

function normalizeUrl(url) {
    // Handle array input (from test tool)
    if (url && typeof url !== "string") {
        if (url.length > 0) {
            url = url[0];
        } else {
            url = BASE_URL;
        }
    }
    url = url || BASE_URL;
    
    // Normalize: thay thế domain bằng BASE_URL nhưng giữ nguyên path
    // Regex này chỉ thay thế phần protocol + domain, giữ lại path, query, hash
    return url.replace(/^https?:\/\/([^\/]+)(\/.*)?$/, function(match, domain, path) {
        path = path || "";
        return BASE_URL + path;
    });
}

function parseCards(doc) {
    var list = [];
    var seen = {};

    // Cách 1: Tìm các thumb links chứa background image (MacCMS myui style)
    // Trên trang /xem/, /type/, các thumb có class myui-vodlist__thumb với style background
    var items = doc.select("a.myui-vodlist__thumb");
    
    // Cách 2: Nếu không có, tìm các box/card containers
    if (items.size() === 0) {
        items = doc.select(".myui-vodlist__box, .myui-vodlist__item, .movie-item, .film-item, .card");
    }
    
    // Cách 3: Nếu vẫn không có, tìm trực tiếp links
    if (items.size() === 0) {
        items = doc.select("a[href*='/phim/']");
    }

    items.forEach(function(item) {
        var a = item;
        // Nếu item không phải là link, tìm link bên trong
        if (!item.attr("href")) {
            a = item.select("a[href*='/phim/']").first();
        }
        if (!a) return;
        
        var href = a.attr("href") || "";
        if (!href || href.indexOf("/phim/") < 0) return;
        if (href.indexOf("http") < 0) href = BASE_URL + href;
        if (seen[href]) return;

        // Lấy tên: ưu tiên title attribute
        var name = a.attr("title") || a.text().trim() || "";
        if (name.length < 2 || name.toLowerCase().indexOf("xem thêm") >= 0) return;

        seen[href] = true;

        // Tìm ảnh: ưu tiên background style trong chính thẻ a
        var cover = "";
        var style = a.attr("style") || "";
        var bgMatch = style.match(/url\((['"]?)(.*?)\1\)/);
        if (bgMatch) {
            cover = bgMatch[2];
        }
        
        // Fallback: tìm data attributes trên a
        if (!cover) {
            cover = a.attr("data-original") || a.attr("data-src") || "";
        }
        
        // Fallback: tìm img bên trong a
        if (!cover) {
            var img = a.select("img").first();
            if (img) {
                cover = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
            }
        }
        
        // Fallback: tìm trong item container (nếu a khác item)
        if (!cover && item !== a) {
            var img2 = item.select("img").first();
            if (img2) {
                cover = img2.attr("data-src") || img2.attr("data-original") || img2.attr("src") || "";
            }
            if (!cover) {
                var style2 = item.attr("style") || "";
                var bgMatch2 = style2.match(/url\((['"]?)(.*?)\1\)/);
                if (bgMatch2) cover = bgMatch2[2];
            }
        }

        // Tìm tag tập phim trong item
        var tag = "";
        var tagSelectors = ".text-muted, .pic-tag, .pic-text, .tag, .episode, .pic-tag-top, .font-12, .pic-tag-bottom";
        var tagEl = item.select(tagSelectors).first();
        if (tagEl) {
            tag = tagEl.text().trim();
        }

        list.push({
            name: name,
            link: href,
            cover: cover,
            tag: tag,
            host: BASE_URL
        });
    });

    return list;
}


// Bỏ parseCards cũ và parseCardsDirect, gộp vào 1 hàm parseCards duy nhất cho gọn và mạnh
function getNextPage(doc, page) {
    var nextPage = (parseInt(page, 10) || 1) + 1;
    var found = "";
    // Tìm link phân trang
    doc.select("a[href*='---']").forEach(function(a) {
        if (found) return;
        var href = a.attr("href");
        // Pattern: /show/1--------2---/
        var m = href.match(/--------(\d+)---\/?$/);
        if (m && m[1] === String(nextPage)) {
            found = String(nextPage);
        }
    });
    
    if (!found) {
        doc.select("a").forEach(function(a) {
            if (found) return;
            var text = a.text().trim();
            if (text === String(nextPage)) {
                found = String(nextPage);
            }
        });
    }
    return found;
}
