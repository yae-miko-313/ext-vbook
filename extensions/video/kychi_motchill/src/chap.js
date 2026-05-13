load('config.js');

function execute(url) {
    if (!url) return Response.error("Link trống");

    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });

    if (response.ok) {
        var doc = response.html();
        var servers = [];

        doc.select(".dooplay_player_option").forEach(function(el) {
            var title = cleanText(el.select(".title").text());
            var host = cleanText(el.select(".server").text());
            var post = el.attr("data-post") || "";
            var nume = el.attr("data-nume") || "";
            var type = el.attr("data-type") || "tv";

            if (!post || !nume) return;

            var serverTitle = title || "Server " + nume;
            if (host && serverTitle.indexOf(host) === -1) {
                serverTitle += " - " + host;
            }

            servers.push({
                title: serverTitle,
                data: JSON.stringify({
                    post: post,
                    nume: nume,
                    type: type,
                    episodeUrl: normalizeUrl(url)
                })
            });
        });

        if (servers.length === 0) {
            servers.push({
                title: "Server mặc định",
                data: JSON.stringify({
                    episodeUrl: normalizeUrl(url)
                })
            });
        }

        return Response.success(servers);
    }

    return Response.error("Không thể tải danh sách server");
}
