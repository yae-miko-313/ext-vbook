load('config.js');

function execute(url) {
    var watchUrl = url.replace(/\/phim-/, '/watch/').replace(/\/phim\//, '/watch/');
    if (watchUrl === url) {
        watchUrl = url.replace(/\/$/, '') + '/watch/';
    }

    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });

    if (response.ok) {
        var doc = response.html();
        var episodes = [];

        var episodeNodes = doc.select(".episodios li a");
        if (episodeNodes.length === 0) {
            episodeNodes = doc.select("a[href*='/xem-phim/']");
        }

        episodeNodes.forEach(function(el) {
            var name = el.text().trim();
            var href = el.attr("href") || "";
            if (name && href) {
                episodes.push({
                    name: name,
                    url: normalizeUrl(href)
                });
            }
        });

        if (episodes.length === 0) {
            episodes.push({
                name: "Full",
                url: url
            });
        }

        return Response.success(episodes);
    }

    return Response.error("Không thể tải danh sách tập");
}
