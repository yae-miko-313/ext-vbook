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
        
        // Find the "Danh sách máy chủ" section
        var sections = doc.select("section.SeasonBx");
        sections.forEach(function(section) {
            var title = section.select(".Title").text().trim();
            if (title.toLowerCase().indexOf("máy chủ") !== -1) {
                section.select(".halim-list-eps li a").forEach(function(el) {
                    servers.push({
                        title: el.text().trim(),
                        data: normalizeUrl(el.attr("href"))
                    });
                });
            }
        });

        if (servers.length === 0) {
            servers.push({
                title: "Server Gốc",
                data: url
            });
        }

        return Response.success(servers);
    }

    return Response.error("Không tải được trang tập phim");
}
