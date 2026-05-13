load('config.js');

function execute(url) {
    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });

    if (response.ok) {
        var doc = response.html();

        function firstText(selector) {
            var el = doc.select(selector).first();
            return el ? el.text().trim() : "";
        }

        function firstAttr(selector, attr) {
            var el = doc.select(selector).first();
            return el ? (el.attr(attr) || "") : "";
        }

        function normalizeTitle(text) {
            text = cleanText(text);
            text = text.replace(/\s*Full\s+HD\s+Vietsub\s*-\s*Motchill\s*$/i, '');
            text = text.replace(/\s*-\s*Motchill\s*$/i, '');
            return cleanText(text);
        }

        function uniqueByName(items) {
            var map = {};
            var out = [];
            items.forEach(function(item) {
                var key = (item && item.name ? item.name.toLowerCase() : '') + '|' + (item && item.link ? item.link.toLowerCase() : '');
                if (!key || map[key]) return;
                map[key] = true;
                out.push(item);
            });
            return out;
        }

        var name = normalizeTitle(firstText(".sheader .data h1"));
        if (!name) {
            name = normalizeTitle(firstAttr("meta[property='og:title']", "content"));
        }

        var cover = firstAttr(".sheader .poster img", "src");
        if (!cover) {
            cover = firstAttr("meta[property='og:image']", "content");
        }

        var description = firstText("#info .wp-content p, .wp-content p");
        if (!description) {
            description = firstAttr("meta[name='description']", "content");
        }

        function isOngoing(text) {
            text = (text || "").toLowerCase();
            if (!text) return false;
            if (text.indexOf("hoàn tất") !== -1 || text.indexOf("full") !== -1 || text.indexOf("completed") !== -1) {
                return false;
            }
            return text.indexOf("tập") !== -1 || text.indexOf("đang") !== -1 || text.indexOf("ongoing") !== -1;
        }

        var episodeCount = firstText(".sheader .item-label");

        var genres = [];
        doc.select(".sheader .sgeneros a[href*='/the-loai/']").forEach(function(el) {
            var title = el.text().trim();
            var href = el.attr("href") || "";
            if (title && href && href.indexOf('/the-loai/') !== -1) {
                genres.push({
                    name: title,
                    link: normalizeUrl(href)
                });
            }
        });
        genres = uniqueByName(genres);

        var countryName = firstText(".sheader .extra .country a");
        var countryLink = firstAttr(".sheader .extra .country a", "href");

        // Collect candidate suggests but return only one (best-priority) to keep UI compact
        var candidates = [];
        if (genres.length > 0) {
            candidates.push({
                title: "Cùng thể loại: " + genres[0].name,
                input: genres[0].link,
                script: "gen.js"
            });
        }

        // related (first) from "Phim mới"
        var relEl = doc.select("#single_relacionados article a").first();
        if (relEl) {
            var relHref = relEl.attr("href");
            var relName = relEl.select("img").attr("alt") || relEl.text().trim();
            if (relHref && relName) {
                candidates.push({
                    title: relName,
                    input: normalizeUrl(relHref),
                    script: "detail.js"
                });
            }
        }

        // sidebar first suggestion (safe: avoid parent() call)
        var sideA = doc.select(".sidebar .w_item_a a").first();
        if (sideA) {
            var sideHref = sideA.attr("href");
            var sideH3 = doc.select(".sidebar .w_item_a h3").first();
            var sideName = sideH3 ? sideH3.text().trim() : "";
            if (sideHref && sideName) {
                candidates.push({
                    title: sideName,
                    input: normalizeUrl(sideHref),
                    script: "detail.js"
                });
            }
        }

        if (countryName && countryLink) {
            candidates.push({
                title: "Theo quốc gia: " + countryName,
                input: normalizeUrl(countryLink),
                script: "gen.js"
            });
        }

        // pick the first unique candidate
        var seen = {};
        var suggests = [];
        for (var i = 0; i < candidates.length; i++) {
            var c = candidates[i];
            var key = c.input || "";
            if (!key) continue;
            if (seen[key]) continue;
            seen[key] = true;
            suggests.push(c);
            break;
        }

        var year = firstText(".sheader .extra .date");
        var country = countryName;
        var runtime = firstText(".sheader .extra .runtime");
        var director = firstText("#cast .persons .person .name a");

        var detailParts = [];
        if (year) detailParts.push("Năm: " + year);
        if (country) detailParts.push("Quốc gia: " + country);
        if (director) detailParts.push("Đạo diễn: " + director);
        if (runtime) detailParts.push("Thời lượng: " + runtime);
        if (episodeCount) detailParts.push(episodeCount);

        if (genres.length > 0) {
            var genreNames = [];
            genres.forEach(function(item) {
                genreNames.push(item.name);
            });
            detailParts.push("Thể loại: " + genreNames.join(", "));
        }

        var status = episodeCount;

        return Response.success({
            name: name || "Không rõ",
            cover: cover ? normalizeUrl(cover) : "",
            host: BASE_URL,
            description: description || "Không có thông tin",
            author: director || "Đang cập nhật",
            detail: detailParts.join("<br>"),
            ongoing: isOngoing(status),
            suggests: suggests,
            format: isOngoing(status) ? "series" : "movie"
        });
    }

    return Response.error("Không thể tải trang chi tiết");
}
