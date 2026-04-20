load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        let list = [];
        
        // Check for "Xem trọn bộ" link
        let fullSeriesLink = doc.select("a.video-details__link").attr("href");
        if (fullSeriesLink && fullSeriesLink.includes("/tag/")) {
            // It's a series, fetch all episodes from the tag page
            let tagResponse = fetch(normalizeUrl(fullSeriesLink));
            if (tagResponse.ok) {
                let tagDoc = tagResponse.html();
                tagDoc.select(".video-box").forEach(e => {
                    let a = e.select("a").first();
                    list.push({
                        name: e.select("h3").text(),
                        url: normalizeUrl(a.attr("href")),
                        host: BASE_URL
                    });
                });
            }
        } else {
            // Single episode or the current page is the episode
            list.push({
                name: doc.select("h1").text() || "Xem ngay",
                url: url,
                host: BASE_URL
            });
        }

        return Response.success(list.reverse()); // Reverse to have Ep 1 first if possible
    }
    return null;
}
