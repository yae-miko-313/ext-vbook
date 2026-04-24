load("config.js");

function cleanText(s) {
    s = (s || "") + "";
    return s.replace(/\s+/g, " ").trim();
}

function extractDescription(doc) {
    var article = doc.select("article").first();
    if (!article) return "";
    return cleanText(article.text() + "");
}

function extractDetail(doc) {
    var lines = [];

    var viewsEl = doc.select(".video-details__views").first();
    if (viewsEl) {
        var views = cleanText(viewsEl.text() + "");
        if (views) lines.push("Lượt xem: " + views);
    }

    doc.select(".video-details__information__details .mb-5").forEach(function(block) {
        var headingEl = block.select(".video-details__information__details__heading").first();
        if (!headingEl) return;

        var heading = cleanText(headingEl.text() + "");
        if (!heading) return;

        var values = [];
        block.select(".video-details__information__details__link").forEach(function(link) {
            var value = cleanText(link.text() + "");
            if (value) values.push(value);
        });

        if (values.length > 0) lines.push(heading + ": " + values.join(", "));
    });

    var allHeadings = doc.select(".video-details__information__details__heading");
    var allLinks = doc.select(".video-details__information__details__link");
    if (allHeadings.size() > 0 && allLinks.size() > 0) {
        var lastHeading = cleanText(allHeadings.last().text() + "");
        if (lastHeading && lastHeading.toLowerCase().indexOf("tag") > -1) {
            var tagValues = [];
            allLinks.forEach(function(link) {
                var value = cleanText(link.text() + "");
                if (!value) return;
                if (tagValues.indexOf(value) === -1) tagValues.push(value);
            });
            if (tagValues.length > 0) lines.push("Tags: " + tagValues.join(", "));
        }
    }

    return lines.join("\n");
}

function getGenres(doc) {
    var seen = {};
    var genres = [];
    function addGenre(el) {
        var title = cleanText(el.text() + "");
        var href = normalizeLink((el.attr("href") || "") + "");
        if (!title || !href || seen[href]) return;
        seen[href] = true;
        genres.push({
            title: title,
            input: href,
            script: "gen.js"
        });
    }
    doc.select(".video-details__information__details__link").forEach(addGenre);
    doc.select("[class*='tag'] a[href*='/the-loai/']").forEach(addGenre);
    return genres;
}

function execute(url) {
    url = normalizeHost(url);

    var res = fetch(url, { method: "GET" });
    if (!res.ok) return Response.error("Cannot load: " + res.status);

    var doc = res.html();

    var name = "";
    var h1 = doc.select("h1").first();
    if (h1) name = h1.text() + "";
    if (!name) {
        var ogTitle = doc.select("meta[property='og:title']").first();
        if (ogTitle) name = ogTitle.attr("content") + "";
    }
    name = cleanText(name);

    var cover = "";
    var ogImage = doc.select("meta[property='og:image']").first();
    if (ogImage) cover = (ogImage.attr("content") || "") + "";
    if (!cover) {
        var firstImg = doc.select("img[src*='/img/']").first();
        if (firstImg) cover = (firstImg.attr("data-src") || firstImg.attr("src") || "") + "";
    }
    cover = normalizeLink(cover);

    var description = extractDescription(doc);
    var detail = extractDetail(doc);

    var genres = getGenres(doc);

    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: "HentaiVietsub",
        detail: detail,
        description: description,
        ongoing: false,
        genres: genres.length > 0 ? genres : undefined
    });
}