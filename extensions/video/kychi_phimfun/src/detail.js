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

        var name = firstText(".Title");
        if (!name) {
            name = firstAttr("meta[property='og:title']", "content");
        }

        var subName = firstText(".SubTitle span");
        var cover = firstAttr(".TPostBg", "src");
        if (!cover) cover = firstAttr(".Image figure img", "src");
        if (!cover) cover = firstAttr("meta[property='og:image']", "content");

        var description = firstText(".Description p");
        if (!description) {
            description = firstAttr("meta[property='og:description']", "content");
        }

        function isOngoing(text) {
            text = (text || "").toLowerCase();
            if (!text) return false;
            if (text.indexOf("full") !== -1 || text.indexOf("hoàn thành") !== -1 || text.indexOf("completed") !== -1) {
                return false;
            }
            return text.indexOf("tập") !== -1 ||
                text.indexOf("đang") !== -1 ||
                text.indexOf("ongoing") !== -1 ||
                text.indexOf("trailer") !== -1 ||
                text.indexOf("/") !== -1;
        }

        var genres = [];
        doc.select(".Genre.phayCuoiCau a").forEach(function(el) {
            var title = el.text().trim();
            var href = el.attr("href") || "";
            if (!title || !href) return;
            genres.push({
                name: title,
                link: normalizeUrl(href)
            });
        });

        var suggests = [];
        if (genres.length > 0) {
            suggests.push({
                title: "Cùng thể loại: " + genres[0].name,
                input: genres[0].link,
                script: "gen.js"
            });
        }

        var detailParts = [];
        if (subName && subName !== name) {
            detailParts.push("Tên gốc: " + subName);
        }

        var status = firstText(".Status, .StatusTxt, .Qlty");
        if (status) detailParts.push("Trạng thái: " + status);

        var year = firstText(".Date");
        if (year) detailParts.push("Năm: " + year);

        var country = firstText(".Country, .Nationality");
        if (country) detailParts.push("Quốc gia: " + country);

        var director = firstText(".phayCuoiCau a[href*='/dao-dien/']");
        if (director) detailParts.push("Đạo diễn: " + director);

        var cast = [];
        doc.select(".Cast.phayCuoiCau a[href*='/dien-vien/']").forEach(function(el) {
            var castName = el.text().trim();
            if (castName) cast.push(castName);
        });
        if (cast.length > 0) detailParts.push("Diễn viên: " + cast.join(", "));

        if (genres.length > 0) {
            var genreNames = [];
            genres.forEach(function(item) {
                genreNames.push(item.name);
            });
            detailParts.push("Thể loại: " + genreNames.join(", "));
        }

        if (year && status && year !== status) {
            detailParts.push("Phát hành: " + year);
        }

        return Response.success({
            name: name || subName || "Không rõ",
            subname: subName,
            cover: cover ? normalizeUrl(cover) : "",
            host: BASE_URL,
            description: description,
            genres: genres,
            author: director || "Đang cập nhật",
            detail: detailParts.join("<br>"),
            ongoing: isOngoing(status),
            suggests: suggests,
            format: isOngoing(status) ? "series" : "movie"
        });
    }

    return null;
}
