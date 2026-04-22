load("config.js");

function normalizeLink(link) {
    if (!link) return "";
    link = link + "";
    if (link.startsWith("//")) return "https:" + link;
    if (link.startsWith("/")) return BASE_URL + link;
    if (!link.startsWith("http")) return BASE_URL + "/" + link;
    return link;
}

function execute(url) {
    if (!url) return Response.error("No url");
    url = normalizeLink(url);

    var res = fetch(url, { method: "GET" });
    if (!res.ok) return Response.error("Cannot load: " + res.status);

    var doc = res.html();
    var name = (doc.select("h1.entry-title").text() || "") + "";
    if (!name) name = (doc.select("title").text() || "") + "";

    var cover = "";
    var firstImg = doc.select("#gallery-1 .gallery-item img").first();
    if (!firstImg) firstImg = doc.select(".entry-content img").first();
    if (firstImg) {
        cover = (firstImg.attr("data-src") || firstImg.attr("data-lazy-src") || firstImg.attr("src") || "") + "";
        cover = normalizeLink(cover);
    }

    var description = "";
    var summary = (doc.select(".entry-content p strong").first() ? doc.select(".entry-content p strong").first().text() : "") + "";
    summary = summary.replace(/\s+/g, " ").trim();

    var author = "Unknown";
    doc.select(".entry-content p").forEach(function(p) {
        if (author !== "Unknown") return;
        var txt = (p.text() || "") + "";
        txt = txt.replace(/\s+/g, " ").trim();
        if (!txt) return;
        var m = txt.match(/Cosplayer\s*:\s*([^\n]+)/i);
        if (m && m[1]) {
            author = m[1].replace(/\s*Character\s*:.*$/i, "").trim();
        }
    });

    if (summary) {
        var normalizedSummary = summary.replace(/^Cosplayer\s*:\s*/i, "").trim();
        if (author && author !== "Unknown" && normalizedSummary === author) {
            summary = "";
        }
    }

    if (author && author !== "Unknown") {
        description = "Cosplayer: " + author;
        if (summary) description = description + "\n" + summary;
    } else {
        description = summary;
    }

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        host: BASE_URL,
        ongoing: false,
        format: "series"
    });
}